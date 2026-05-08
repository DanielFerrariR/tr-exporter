import fs from 'fs';
import path from 'path';
import { EnrichedTransaction } from '@/domain/models';
import { Portfolio } from '@/domain/portfolio';
import { mapTransactionsToPortfolioData } from '@/domain/portfolio/mapTransactionsToPortfolioData';

export const buildPortfolio =
  (phoneNumber: string) =>
  async (txs: EnrichedTransaction[]): Promise<EnrichedTransaction[]> => {
    console.log('Generating portfolio data...');
    const portfolioData: Portfolio = mapTransactionsToPortfolioData(txs);
    const filePath = path.join(
      process.cwd(),
      'build',
      phoneNumber,
      'portfolioData.json',
    );
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(portfolioData, null, 2));
    console.log(`File "portfolioData.json" successfully saved to ${filePath}.`);
    return txs;
  };
