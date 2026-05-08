import { TransactionDocument } from './TransactionDocument';

export interface TransactionDocumentsSection {
  title: string;
  data: TransactionDocument[];
  type: 'documents';
}
