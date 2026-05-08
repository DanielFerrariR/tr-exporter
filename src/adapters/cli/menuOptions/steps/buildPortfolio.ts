import { saveFile } from '@/utils/saveFile';
import { EnrichedTransaction } from '@/domain/models';
import { Portfolio } from '@/domain/portfolio';
import { mapTransactionsToPortfolioData } from '@/domain/portfolio/mapTransactionsToPortfolioData';

const OUTPUT_DIRECTORY = 'build';

export const buildPortfolio =
  (phoneNumber: string) =>
  async (txs: EnrichedTransaction[]): Promise<EnrichedTransaction[]> => {
    console.log('Generating portfolio data...');
    const portfolioData: Portfolio = mapTransactionsToPortfolioData(txs);
    saveFile(
      JSON.stringify(portfolioData, null, 2),
      'portfolioData.json',
      `${OUTPUT_DIRECTORY}/${phoneNumber}`,
    );
    return txs;
  };
