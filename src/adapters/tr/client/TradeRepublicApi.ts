import { Cookie, CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';
import { LoginPayload } from '../auth/LoginPayload';
import { LoginProcessResponse } from '../auth/LoginProcessResponse';
import { TradeRepublicApiLoginError } from '../errors/TradeRepublicApiLoginError';
import { TradeRepublicApiLoginProcessError } from '../errors/TradeRepublicApiLoginProcessError';
import { Subscription } from '../protocol/Subscription';
import { SUBSCRIPTION_TYPES } from '../protocol/SubscriptionTypes';
import { CONNECTION_STATUS } from '../protocol/ConnectionStatus';
import { RECEIVED_COMMAND_TYPES } from '../protocol/ReceivedCommandTypes';
import { CONNECTION_MESSAGE } from '../config/connectionMessage';
import { TRADE_REPUBLIC_API_HEADERS } from '../config/headers';
import {
  TRADE_REPUBLIC_API_URL,
  TRADE_REPUBLIC_WEBSOCKET_URL,
} from '../config/urls';
import { ConnectOptions } from './ConnectOptions';
import { SubscriptionMessagePayloadMap } from './SubscriptionMessagePayloadMap';
import { getOrCreateDeviceId } from './deviceIdStorage';
import { AccountInformation } from '../account';
import { Activity } from '../timeline/Activity';
import { ActivityResponse } from '../timeline/ActivityResponse';
import { Transaction } from '../timeline/Transaction';
import { TransactionDetailsResponse } from '../timeline/TransactionDetailsResponse';
import { TransactionResponse } from '../timeline/TransactionResponse';

export class TradeRepublicAPI {
  private static instance: TradeRepublicAPI;
  private _cookieJar: CookieJar;
  private _client: AxiosInstance;
  private _webSocket?: WebSocket;
  private _sessionToken?: string;
  private _subscriptionId = 1;
  private _subscriptions: Record<number, Subscription> = {};

  private constructor() {
    this._cookieJar = new CookieJar();
    this._client = axios.create({
      baseURL: TRADE_REPUBLIC_API_URL,
      withCredentials: true,
      headers: TRADE_REPUBLIC_API_HEADERS,
    });
    wrapper(this._client);
    this._client.defaults.jar = this._cookieJar;
  }

  public static getInstance(): TradeRepublicAPI {
    TradeRepublicAPI.instance ??= new TradeRepublicAPI();
    return TradeRepublicAPI.instance;
  }

  private _buildDeviceInfoHeader(): string {
    const deviceInfo = {
      stableDeviceId: getOrCreateDeviceId(),
      browser: 'Chrome',
      browserVersion: '137.0.0.0',
      os: 'Linux',
      osVersion: 'x86_64',
      timezone: 'Europe/Berlin',
      timezoneOffset: -120,
      screen: '1920x1080x24',
      preferredLanguages: ['en-US', 'en'],
      numberOfCores: 8,
      deviceMemory: 8,
    };
    return Buffer.from(JSON.stringify(deviceInfo)).toString('base64');
  }

  public async login({ phoneNumber, pin }: LoginPayload) {
    try {
      return await this._client.post(
        '/api/v2/auth/web/login',
        { phoneNumber, pin },
        { headers: { 'x-tr-device-info': this._buildDeviceInfoHeader() } },
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new TradeRepublicApiLoginError(
          error.message,
          error.response?.data,
        );
      }

      throw error;
    }
  }

  public async submitAuthenticatorCode(
    processId: string,
    code: string,
  ): Promise<void> {
    try {
      await this._client.post(
        `/api/v2/auth/web/login/processes/${processId}/authenticator-verification`,
        { code },
        { headers: { 'x-tr-device-info': this._buildDeviceInfoHeader() } },
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new TradeRepublicApiLoginProcessError(
          error.message,
          error.response?.data,
        );
      }

      throw error;
    }
  }

  public async pollLoginProcess(
    processId: string,
  ): Promise<LoginProcessResponse> {
    try {
      const response = await this._client.get<LoginProcessResponse>(
        `/api/v2/auth/web/login/processes/${processId}`,
        { headers: { 'x-tr-device-info': this._buildDeviceInfoHeader() } },
      );

      if (response.data.status === 'CONFIRMED') {
        const cookies: Cookie[] = await this._cookieJar.getCookies(
          TRADE_REPUBLIC_API_URL,
        );
        this._sessionToken = cookies.find(
          (cookie) => cookie.key === 'tr_session',
        )?.value;
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new TradeRepublicApiLoginProcessError(
          error.message,
          error.response?.data,
        );
      }

      throw error;
    }
  }

  public sendSubscriptionMessage<SubscriptionType extends SUBSCRIPTION_TYPES>(
    type: SubscriptionType,
    payloadData?: SubscriptionMessagePayloadMap[SubscriptionType],
  ) {
    if (!this._webSocket) {
      console.warn('WebSocket is not connected.');
      return;
    }

    const jsonPayload = {
      type,
      token: this._sessionToken,
      ...payloadData,
    };

    this._webSocket.send(
      `sub ${this._subscriptionId} ${JSON.stringify(jsonPayload)}`,
    );
    this._subscriptions[this._subscriptionId] = jsonPayload;
    this._subscriptionId++;
  }

  public sendMessage(message: string) {
    if (!this._webSocket) {
      console.warn('WebSocket is not connected.');
      return;
    }

    if (message === 'echo') {
      this._webSocket.send(message);
      return;
    }

    let parsedMessage = message;

    try {
      const jsonMatch = parsedMessage.match(/\{.*\}/s);
      if (!jsonMatch) throw new Error('No JSON payload found in message');
      const jsonPayload = JSON.parse(jsonMatch[0]);
      jsonPayload.token = this._sessionToken;
      parsedMessage = `sub ${this._subscriptionId} ${JSON.stringify(jsonPayload)}`;
      this._subscriptions[this._subscriptionId] = jsonPayload;
      this._subscriptionId++;
    } catch (error) {
      console.warn(
        "Could not parse subscription message for token injection. Ensure it's valid JSON. Message not sent.",
        error,
      );
      return;
    }

    console.log('Sending message:', message);
    this._webSocket?.send(parsedMessage);
  }

  public connect({
    onOpen,
    onClose,
    onConnected,
    onMessage,
    onError,
  }: ConnectOptions = {}) {
    this._webSocket = new WebSocket(TRADE_REPUBLIC_WEBSOCKET_URL);

    this._webSocket.onopen = async () => {
      if (this._webSocket) {
        this._webSocket.send(CONNECTION_MESSAGE);
      }
      onOpen?.();
    };

    this._webSocket.onmessage = (event) => {
      const message = event.data.toString();

      if (message === 'connected') {
        onConnected?.(message);
        return;
      }

      let jsonPayload: object | undefined;

      const [subscriptionId, command] = message.split(' ', 2);
      const jsonMatch = message.match(/\{.*\}/s);

      try {
        if (jsonMatch) jsonPayload = JSON.parse(jsonMatch[0]);
      } catch (error) {
        console.warn('Failed to parse JSON payload:', error);
      }

      onMessage?.(message, {
        command,
        jsonPayload,
        subscription: this._subscriptions[Number(subscriptionId)],
      });
    };

    this._webSocket.onclose = (event) => {
      onClose?.(event);
    };

    this._webSocket.onerror = (event) => {
      onError?.(event);
    };
  }

  public disconnect() {
    if (!this._webSocket) {
      console.warn('WebSocket is not connected.');
      return;
    }

    this._webSocket.close();
    this._webSocket = undefined;
  }

  public getConnectionStatus() {
    if (!this._webSocket) {
      console.warn('WebSocket is not connected.');
      return;
    }

    const webSocket = this._webSocket;
    let status = CONNECTION_STATUS.UNKNOWN;
    Object.values(CONNECTION_STATUS).forEach((value) => {
      if (webSocket.readyState === value) {
        status = value;
      }
    });
    return status;
  }

  public fetchAccountData(): Promise<{
    accountInformation: AccountInformation;
    activities: Activity[];
    transactions: Transaction[];
  }> {
    return new Promise((resolve, reject) => {
      const accountInformation: AccountInformation = {
        accountNumber: '',
        currencyId: 'EUR',
        amount: '',
      };
      let activities: Activity[] = [];
      let transactions: Transaction[] = [];

      this.connect({
        onConnected: () => {
          this.sendSubscriptionMessage(SUBSCRIPTION_TYPES.CASH);
        },
        onMessage: (_message, { command, jsonPayload, subscription }) => {
          if (command === RECEIVED_COMMAND_TYPES.KEEP_ALIVE) return;
          if (!jsonPayload) return;

          if (subscription?.type === SUBSCRIPTION_TYPES.CASH) {
            const cash = jsonPayload as AccountInformation;
            accountInformation.accountNumber = cash.accountNumber;
            accountInformation.currencyId = cash.currencyId;
            accountInformation.amount = cash.amount;
            this.sendSubscriptionMessage(SUBSCRIPTION_TYPES.ACTIVITIES);
            return;
          }

          if (subscription?.type === SUBSCRIPTION_TYPES.ACTIVITIES) {
            const response = jsonPayload as ActivityResponse;
            activities = activities.concat(response.items);
            if (response.cursors.after) {
              this.sendSubscriptionMessage(SUBSCRIPTION_TYPES.ACTIVITIES, {
                after: response.cursors.after,
              });
            } else {
              this.sendSubscriptionMessage(SUBSCRIPTION_TYPES.TRANSACTIONS);
            }
            return;
          }

          if (subscription?.type === SUBSCRIPTION_TYPES.TRANSACTIONS) {
            const response = jsonPayload as TransactionResponse;
            transactions = transactions.concat(response.items);
            if (response.cursors.after) {
              this.sendSubscriptionMessage(SUBSCRIPTION_TYPES.TRANSACTIONS, {
                after: response.cursors.after,
              });
            } else {
              this.disconnect();
              resolve({ accountInformation, activities, transactions });
            }
          }
        },
        onClose: (event) => {
          const isNormal = event.code === 1000 || event.code === 1001;
          if (!isNormal)
            reject(
              new Error(
                `WebSocket closed unexpectedly: Code ${event.code}, Reason: ${event.reason || 'No reason provided'}`,
              ),
            );
        },
        onError: (error) => reject(error),
      });
    });
  }

  public fetchTransactionDetails(
    ids: string[],
  ): Promise<Record<string, TransactionDetailsResponse>> {
    if (ids.length === 0) return Promise.resolve({});

    return new Promise((resolve, reject) => {
      const details: Record<string, TransactionDetailsResponse> = {};
      const pending = new Set(ids);

      this.connect({
        onConnected: () => {
          for (const id of ids) {
            this.sendSubscriptionMessage(
              SUBSCRIPTION_TYPES.TRANSACTION_DETAILS,
              { id },
            );
          }
        },
        onMessage: (_message, { command, jsonPayload, subscription }) => {
          if (command === RECEIVED_COMMAND_TYPES.KEEP_ALIVE) return;
          if (!jsonPayload) return;
          if (
            subscription === undefined ||
            subscription.type !== SUBSCRIPTION_TYPES.TRANSACTION_DETAILS ||
            !subscription.id
          )
            return;

          details[subscription.id] = jsonPayload as TransactionDetailsResponse;
          pending.delete(subscription.id);

          if (pending.size === 0) {
            this.disconnect();
            resolve(details);
          }
        },
        onClose: (event) => {
          const isNormal = event.code === 1000 || event.code === 1001;
          if (!isNormal)
            reject(
              new Error(
                `WebSocket closed unexpectedly: Code ${event.code}, Reason: ${event.reason || 'No reason provided'}`,
              ),
            );
        },
        onError: (error) => reject(error),
      });
    });
  }
}
