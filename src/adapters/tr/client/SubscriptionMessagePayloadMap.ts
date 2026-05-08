import { SUBSCRIPTION_TYPES } from '../protocol/SubscriptionTypes';
import { ActivityPayload } from '../timeline/ActivityPayload';
import { TransactionDetailsPayload } from '../timeline/TransactionDetailsPayload';
import { TransactionPayload } from '../timeline/TransactionPayload';

export interface SubscriptionMessagePayloadMap {
  [SUBSCRIPTION_TYPES.ACTIVITIES]: ActivityPayload;
  [SUBSCRIPTION_TYPES.TRANSACTIONS]: TransactionPayload;
  [SUBSCRIPTION_TYPES.TRANSACTION_DETAILS]: TransactionDetailsPayload;
  [SUBSCRIPTION_TYPES.CASH]: undefined;
}
