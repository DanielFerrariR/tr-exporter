import { TransactionAction } from './TransactionAction';

export interface TransactionHeaderSection {
  title: string;
  data: {
    icon: string | { asset: string; badge: string | null };
    timestamp: string;
    status: string;
    subtitleText?: string | null;
  };
  type: 'header';
  action?: TransactionAction;
}
