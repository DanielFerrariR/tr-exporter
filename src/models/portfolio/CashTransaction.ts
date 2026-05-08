import { TRANSACTION_EVENT_TYPE } from '@/constants';
import { TRANSACTION_TYPE } from './TransactionType';

export interface CashTransaction {
  title: string;
  eventType:
    | TRANSACTION_EVENT_TYPE.INTEREST
    | TRANSACTION_EVENT_TYPE.TAX_CORRECTION;
  type: TRANSACTION_TYPE.CASH_GAIN | TRANSACTION_TYPE.CASH_EXPENSE;
  date: string;
  amount: string;
  currency: string;
  tax: string;
}
