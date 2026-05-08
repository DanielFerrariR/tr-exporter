import { TransactionAction } from './TransactionAction';

export interface TransactionDocument {
  title: string;
  action: TransactionAction;
  id: string;
  postboxType: string;
  detail?: null;
}
