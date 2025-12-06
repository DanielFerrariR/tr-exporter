import fs from 'fs';
import { Transaction } from '@/types';
import { mapTransactionsToPortfolioData, saveFile } from '@/utils';
import { getPhoneNumber } from '@/utils/phoneNumberStorage';

export const loadTransactions = async (): Promise<{
  transactions: Transaction[];
  phoneNumber: string;
} | null> => {
  const phoneNumber = getPhoneNumber();

  if (!phoneNumber) {
    console.error('Error: Phone number not set.');
    console.error('Please set your phone number first.');
    return null;
  }

  const transactionsPath = `build/${phoneNumber}/transactions.json`;
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
    return { transactions, phoneNumber };
  } catch (error) {
    console.error(`Error reading ${transactionsPath}:`, error);
    return null;
  }
};

export const handleConvertTransactionsToPortfolio = async (): Promise<void> => {
  try {
    const result = await loadTransactions();
    if (!result) return;

    const { transactions, phoneNumber } = result;

    console.log('Converting transactions to portfolio data...');
    const portfolioData = mapTransactionsToPortfolioData(transactions);

    saveFile(
      JSON.stringify(portfolioData, null, 2),
      'portfolioData.json',
      `build/${phoneNumber}`,
    );
    console.log('Portfolio data generated successfully.');
  } catch (error) {
    console.error('Error converting transactions to portfolio data:', error);
  }
};
