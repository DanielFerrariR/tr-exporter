import { TransactionAction } from './TransactionAction';
import { TransactionAmount } from './TransactionAmount';
import { TransactionSection } from './TransactionSection';

export interface Transaction {
  id: string;
  timestamp: string;
  title: string;
  icon: string;
  badge: unknown;
  subtitle: string | null;
  amount: TransactionAmount | null;
  subAmount: unknown;
  status: 'EXECUTED' | 'CANCELED';
  action: TransactionAction;
  cashAccountNumber: string | null;
  hidden: boolean;
  deleted: boolean;
  sections?: TransactionSection[];
}
