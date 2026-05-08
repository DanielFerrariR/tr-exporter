import { EnrichedTransaction } from '@/domain/models';
import { restampCorrectedDividends } from '@/domain/portfolio/restampCorrectedDividends';

export const restampDividends =
  (phoneNumber: string) =>
  (txs: EnrichedTransaction[]): Promise<EnrichedTransaction[]> => {
    return restampCorrectedDividends(txs, phoneNumber);
  };
