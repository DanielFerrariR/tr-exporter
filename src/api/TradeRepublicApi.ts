import { Cookie, CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import axios, { AxiosInstance } from 'axios';
import {
  ConnectOptions,
  LoginPayload,
  SubscriptionMessagePayloadMap,
  Subscription,
  TradeRepublicApiLoginError,
  TradeRepublicApiPinVerificationError,
  VerifySmsPinPayload,
} from '../types';
import {
  CONNECTION_MESSAGE,
  CONNECTION_STATUS,
  SUBSCRIPTION_TYPES,
  TRADE_REPUBLIC_API_HEADERS,
  TRADE_REPUBLIC_API_URL,
  TRADE_REPUBLIC_WEBSOCKET_URL,
} from '../constants';
import WebSocket from 'ws';

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

  public async login({ phoneNumber, pin }: LoginPayload) {
    try {
      return await this._client.post('/api/v1/auth/web/login', {
        phoneNumber,
        pin,
      });
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

  public async verifyPushNotificationPin({
    processId,
    pushNotificationPin,
  }: VerifySmsPinPayload) {
    try {
      await this._client.post(
        `/api/v1/auth/web/login/${processId}/${pushNotificationPin}`,
      );
      // Get the session token from cookies after login
      const cookies: Cookie[] = await this._cookieJar.getCookies(
        TRADE_REPUBLIC_API_URL,
      );
      this._sessionToken = cookies.find(
        (cookie) => cookie.key === 'tr_session',
      )?.value;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new TradeRepublicApiPinVerificationError(
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

    // Echo messages are sent as-is
    if (message === 'echo') {
      this._webSocket.send(message);
      return;
    }

    let parsedMessage = message;

    // To always include the token if the message has a format like: {"type":"availableCash"}
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
        // jsonMatch might be undefined if command is keep-alive
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
}
