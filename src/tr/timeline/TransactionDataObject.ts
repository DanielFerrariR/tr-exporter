import { TransactionAction } from './TransactionAction';
import { TransactionDetail } from './TransactionDetail';

export interface TransactionDataObject {
  title: string;
  detail: TransactionDetail;
  style: string;
  action?: TransactionAction;
  id?: string;
  postboxType?: string;
}
