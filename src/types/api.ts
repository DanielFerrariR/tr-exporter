import { CloseEvent, ErrorEvent } from 'ws';
import { SUBSCRIPTION_TYPES } from '@/constants';
import { ActivityPayload } from '@/types/activities';
import {
  TransactionDetailsPayload,
  TransactionPayload,
} from '@/types/transactions';

export interface LoginPayload {
  phoneNumber: string;
  pin: string;
}

export interface VerifySmsPinPayload {
  processId: string;
  pushNotificationPin: string;
}

export interface Subscription {
  id?: string;
  after?: string;
  type: SUBSCRIPTION_TYPES;
  token?: string;
}

export interface SplitMessage {
  command: string;
  jsonPayload?: object;
  subscription?: Subscription;
}

export interface ConnectOptions {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onConnected?: (message: string) => void;
  onMessage?: (message: string, splitMessage: SplitMessage) => void;
  onError?: (event: ErrorEvent) => void;
}

export interface SubscriptionMessagePayloadMap {
  [SUBSCRIPTION_TYPES.ACTIVITIES]: ActivityPayload;
  [SUBSCRIPTION_TYPES.TRANSACTIONS]: TransactionPayload;
  [SUBSCRIPTION_TYPES.TRANSACTION_DETAILS]: TransactionDetailsPayload;
  [SUBSCRIPTION_TYPES.CASH]: undefined;
}
