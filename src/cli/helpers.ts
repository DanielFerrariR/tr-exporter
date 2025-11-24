import fs from 'fs';
import inquirer from 'inquirer';
import { PortfolioData, Transaction } from '@/types';
import {
  findAllAccountNumbers,
  getPortfolioDataPath,
  getTransactionsPath,
} from './utils';

// Account number will be set after downloading transactions
let accountNumber: string | null = null;

// Get account number: use stored value, or find from build folder
// If multiple exist, prompt user to choose
export const getAccountNumber = async (): Promise<string | null> => {
  // Use stored account number if available
  if (accountNumber) {
    return accountNumber;
  }

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

export const setAccountNumber = (accountNum: string): void => {
  accountNumber = accountNum;
};

export const loadTransactions = async (): Promise<Transaction[] | null> => {
  // Get account number (with user selection if multiple exist)
  const accountNum = await getAccountNumber();

  if (!accountNum) {
    console.error('Error: Account number not found.');
    console.error(
      'Please download transactions first using option 1 before converting.',
    );
    return null;
  }

  const transactionsPath = getTransactionsPath(accountNum);
  if (!fs.existsSync(transactionsPath)) {
    console.error(`Error: ${transactionsPath} not found.`);
    console.error(
      'Please download transactions first using option 1 before converting.',
    );
    return null;
  }

  try {
    console.log(`Reading transactions from ${transactionsPath}...`);
    return JSON.parse(fs.readFileSync(transactionsPath, 'utf8'));
  } catch (error) {
    console.error(`Error reading ${transactionsPath}:`, error);
    return null;
  }
};

export const loadPortfolioData = async (): Promise<PortfolioData | null> => {
  // Get account number (with user selection if multiple exist)
  const accountNum = await getAccountNumber();

  if (!accountNum) {
    console.error('Error: Account number not found.');
    console.error(
      'Please download transactions first using option 1 before converting.',
    );
    return null;
  }

  const portfolioDataPath = getPortfolioDataPath(accountNum);
  if (!fs.existsSync(portfolioDataPath)) {
    console.error(`Error: ${portfolioDataPath} not found.`);
    console.error(
      'Please convert transactions to portfolio data first using option 2.',
    );
    return null;
  }

  try {
    console.log(`Reading portfolio data from ${portfolioDataPath}...`);
    return JSON.parse(fs.readFileSync(portfolioDataPath, 'utf8'));
  } catch (error) {
    console.error(`Error reading ${portfolioDataPath}:`, error);
    return null;
  }
};
