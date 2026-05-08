import { TransactionDataObject } from './TransactionDataObject';

export interface TransactionTableSection {
  title?: string;
  data: TransactionDataObject[];
  type: 'table';
}
