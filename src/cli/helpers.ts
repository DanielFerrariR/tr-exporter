import fs from 'fs';
import inquirer from 'inquirer';
import { PortfolioData, Transaction } from '@/types';

// Find all account numbers by scanning build folder
const findAllAccountNumbers = (): string[] => {
  if (!fs.existsSync('build')) {
    return [];
  }

  const entries = fs.readdirSync('build', { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
};

// Get account number from build folder
// If multiple exist, prompt user to choose
const getAccountNumber = async (): Promise<string | null> => {
  // Find all account numbers in build folder
  const accountNumbers = findAllAccountNumbers();

  if (accountNumbers.length === 0) {
    return null;
  }

  // If only one exists, use it automatically
  if (accountNumbers.length === 1) {
    return accountNumbers[0];
  }

  // If multiple exist, let user choose
  const { selectedAccountNumber } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedAccountNumber',
      message: 'Multiple account directories found. Please select one:',
      choices: accountNumbers.map((accNum) => ({
        name: accNum,
        value: accNum,
      })),
    },
  ]);

  return selectedAccountNumber;
};

export const loadTransactions = async (): Promise<{
  transactions: Transaction[];
  accountNum: string;
} | null> => {
  // Get account number (with user selection if multiple exist)
  const accountNum = await getAccountNumber();

  if (!accountNum) {
    console.error('Error: Account number not found.');
    console.error(
      'Please download transactions first using option 1 before converting.',
    );
    return null;
  }

  const transactionsPath = `build/${accountNum}/transactions.json`;
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
    return { transactions, accountNum };
  } catch (error) {
    console.error(`Error reading ${transactionsPath}:`, error);
    return null;
  }
};

export const loadPortfolioData = async (): Promise<{
  portfolioData: PortfolioData;
  accountNum: string;
} | null> => {
  // Get account number (with user selection if multiple exist)
  const accountNum = await getAccountNumber();

  if (!accountNum) {
    console.error('Error: Account number not found.');
    console.error(
      'Please download transactions first using option 1 before converting.',
    );
    return null;
  }

  const portfolioDataPath = `build/${accountNum}/portfolioData.json`;
  if (!fs.existsSync(portfolioDataPath)) {
    console.error(`Error: ${portfolioDataPath} not found.`);
    console.error(
      'Please convert transactions to portfolio data first using option 2.',
    );
    return null;
  }

  try {
    console.log(`Reading portfolio data from ${portfolioDataPath}...`);
    const portfolioData = JSON.parse(
      fs.readFileSync(portfolioDataPath, 'utf8'),
    );
    return { portfolioData, accountNum };
  } catch (error) {
    console.error(`Error reading ${portfolioDataPath}:`, error);
    return null;
  }
};
