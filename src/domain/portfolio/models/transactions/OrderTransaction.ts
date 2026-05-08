import { TRANSACTION_EVENT_TYPE } from '@/domain/constants';
import { TRANSACTION_TYPE } from '../TransactionType';

export interface OrderTransaction {
  title: string;
  eventType:
    | TRANSACTION_EVENT_TYPE.TRADE
    | TRANSACTION_EVENT_TYPE.SAVINGS_PLAN
    | TRANSACTION_EVENT_TYPE.ROUNDUP
    | TRANSACTION_EVENT_TYPE.CASHBACK
    | TRANSACTION_EVENT_TYPE.WELCOME_STOCK_GIFT
    | TRANSACTION_EVENT_TYPE.RECEIVED_GIFT
    | TRANSACTION_EVENT_TYPE.GIVE_AWAY_GIFT;
  type: TRANSACTION_TYPE.BUY | TRANSACTION_TYPE.SELL;
  date: string;
  isin: string;
  price: string;
  quantity: string;
  currency: string;
  fee: string;
  tax: string;
  taxCorrection: string;
  exchange: string;
}
