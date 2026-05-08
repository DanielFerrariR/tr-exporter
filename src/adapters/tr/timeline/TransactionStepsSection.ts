import { TransactionStep } from './TransactionStep';

export interface TransactionStepsSection {
  title: string;
  steps: TransactionStep[];
  type: 'steps';
}
