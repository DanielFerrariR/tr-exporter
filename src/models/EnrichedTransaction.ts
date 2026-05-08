import { TRANSACTION_EVENT_TYPE } from '@/constants';
import { Transaction } from '@/tr';

export interface EnrichedTransaction extends Transaction {
  eventType: TRANSACTION_EVENT_TYPE;
}
