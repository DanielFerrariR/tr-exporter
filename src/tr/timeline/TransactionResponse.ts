import { Transaction } from './Transaction';

export interface TransactionResponse {
  items: Transaction[];
  cursors: { after: string | null; before: string | null };
  startingTransactionId: null;
}
