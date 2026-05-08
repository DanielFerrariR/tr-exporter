import { EnrichedTransaction } from '@/domain/models';

export type Step = (
  txs: EnrichedTransaction[],
) => Promise<EnrichedTransaction[]>;

export { fetchEnrichedTransactions } from './fetchEnrichedTransactions';
export { downloadPdfs } from './downloadPdfs';
export { restampDividends } from './restampDividends';
export { buildPortfolio } from './buildPortfolio';
