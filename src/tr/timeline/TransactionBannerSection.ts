import { TransactionAction } from './TransactionAction';

export interface TransactionBannerSection {
  title: string;
  description: string;
  type: 'banner';
  actionableTitle?: {
    title: string;
    action: TransactionAction;
  };
  button?: {
    title: string;
    action: TransactionAction;
  };
}
