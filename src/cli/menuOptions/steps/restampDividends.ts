import { EnrichedTransaction } from '@/models';
import { restampCorrectedDividends } from '@/portfolio/restampCorrectedDividends';

export const restampDividends =
  (phoneNumber: string) =>
  (txs: EnrichedTransaction[]): Promise<EnrichedTransaction[]> => {
    return restampCorrectedDividends(txs, phoneNumber);
  };
