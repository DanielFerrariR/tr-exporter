import { EnrichedTransaction } from '@/domain/models';
import {
  fetchEnrichedTransactions,
  downloadPdfs,
  restampDividends,
  buildPortfolio,
  type Step,
} from './steps';

export const downloadPortfolio = async (phoneNumber: string): Promise<void> => {
  const steps: Step[] = [
    fetchEnrichedTransactions(phoneNumber),
    downloadPdfs(phoneNumber),
    restampDividends(phoneNumber),
    buildPortfolio(phoneNumber),
  ];

  let txs: EnrichedTransaction[] = [];
  for (const step of steps) txs = await step(txs);
};
