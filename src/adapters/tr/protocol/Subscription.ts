import { SUBSCRIPTION_TYPES } from './SubscriptionTypes';

export interface Subscription {
  id?: string;
  after?: string;
  type: SUBSCRIPTION_TYPES;
  token?: string;
}
