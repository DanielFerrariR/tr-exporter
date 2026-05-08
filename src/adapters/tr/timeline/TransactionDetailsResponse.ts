import { TransactionSection } from './TransactionSection';

export interface TransactionDetailsResponse {
  id: string;
  sections: TransactionSection[];
}
