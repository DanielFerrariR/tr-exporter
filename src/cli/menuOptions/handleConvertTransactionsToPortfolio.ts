import fs from 'fs';
import { Transaction } from '@/types';
import { getAccountNumber } from '@/utils/getAccountNumber';
import { mapTransactionsToPortfolioData, saveFile } from '@/utils';

export const loadTransactions = async (): Promise<{
  transactions: Transaction[];
  accountNumber: string;
} | null> => {
  // Get account number (with user selection if multiple exist)
  const accountNumber = await getAccountNumber();

  if (!accountNumber) {
    console.error('Error: Account number not found.');
    console.error(
      'Please download transactions first using option 1 before converting.',
    );
    return null;
  }

  const transactionsPath = `build/${accountNumber}/transactions.json`;
  if (!fs.existsSync(transactionsPath)) {
    console.error(`Error: ${transactionsPath} not found.`);
    console.error(
      'Please download transactions first using option 1 before converting.',
    );
    return null;
  }

  try {
    console.log(`Reading transactions from ${transactionsPath}...`);
    const transactions = JSON.parse(fs.readFileSync(transactionsPath, 'utf8'));
    return { transactions, accountNumber };
  } catch (error) {
    console.error(`Error reading ${transactionsPath}:`, error);
    return null;
  }
};

export const handleConvertTransactionsToPortfolio = async (): Promise<void> => {
  try {
    const result = await loadTransactions();
    if (!result) return;

    const { transactions, accountNumber } = result;

    console.log('Converting transactions to portfolio data...');
    const portfolioData = mapTransactionsToPortfolioData(transactions);

    saveFile(
      JSON.stringify(portfolioData, null, 2),
      'portfolioData.json',
      `build/${accountNumber}`,
    );
    console.log('Portfolio data generated successfully.');
  } catch (error) {
    console.error('Error converting transactions to portfolio data:', error);
  }
};
