import { TRANSACTION_EVENT_TYPE } from '@/domain/constants';

export interface DividendTransaction {
  title: string;
  eventType: TRANSACTION_EVENT_TYPE.DIVIDEND;
  date: string;
  isin: string;
  currency: string;
  tax: string;
  exchange: string;
  shares: string;
  dividendPerShare: string;
  dividendTotal: string;
}
