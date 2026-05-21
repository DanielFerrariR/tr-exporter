import { TRANSACTION_EVENT_TYPE } from '@/domain/constants';

export interface IsinChangeTransaction {
  title: string;
  eventType: TRANSACTION_EVENT_TYPE.ISIN_CHANGE;
  date: string;
  oldIsin: string;
  newIsin: string;
  oldShares: string;
  newShares: string;
}
