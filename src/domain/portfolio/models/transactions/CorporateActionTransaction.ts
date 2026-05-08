import { TRANSACTION_EVENT_TYPE } from '@/domain/constants';

export interface CorporateActionTransaction {
  title: string;
  eventType: TRANSACTION_EVENT_TYPE.CORPORATE_ACTION;
  date: string;
  isin: string;
  creditedShares: string;
  debitedShares: string;
}
