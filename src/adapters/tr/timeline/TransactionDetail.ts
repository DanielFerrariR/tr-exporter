import { TransactionAction } from './TransactionAction';

export interface TransactionDetail {
  text?: string;
  action?: TransactionAction;
  type: string;
  icon?: string;
  style?: string;
  functionalStyle?: string;
  displayValue?: {
    text: string;
    prefix: string;
    displayValue: {
      text: string;
    };
  };
  title?: string;
  timestamp?: string;
  amount?: string;
  status?: string;
  subtitle?: string;
  content?: {
    type: string;
    title: string;
    truncate: boolean;
  };
  trailing?: {
    type: string;
  };
}
