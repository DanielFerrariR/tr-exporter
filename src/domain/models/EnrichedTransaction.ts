import { TRANSACTION_EVENT_TYPE } from '@/domain/constants';
import { Transaction } from '@/adapters/tr';

export interface EnrichedTransaction extends Transaction {
  eventType: TRANSACTION_EVENT_TYPE;
}
