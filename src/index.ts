import fs from 'fs';
import inquirer from 'inquirer';
import {
  getTransactions,
  interactiveSocketConnection,
  login,
  mapTransactionsToPortfolioData,
  saveFile,
} from './utils';
import { EXPORTERS, getExporterById } from './exporters';
import { PortfolioData, Transaction } from './types';

const MENU_OPTIONS = {
  DOWNLOAD_TRANSACTIONS: 'downloadTransactions',
  CONVERT_TRANSACTIONS_TO_PORTFOLIO: 'convertTransactionsToPortfolio',
  CONVERT_TRANSACTIONS: 'convertTransactions',
  INTERACTIVE_SOCKET_CONNECTION: 'interactiveSocketConnection',
  EXIT: 'exit',
};

// Account number will be set after downloading transactions
let accountNumber: string | null = null;

const getTransactionsPath = (accountNum: string | null): string => {
  if (!accountNum) {
    throw new Error(
      'Account number not available. Please download transactions first.',
    );
  }
  return `build/${accountNum}/transactions.json`;
};

const getPortfolioDataPath = (accountNum: string | null): string => {
  if (!accountNum) {
    throw new Error(
      'Account number not available. Please download transactions first.',
    );
  }
  return `build/${accountNum}/portfolioData.json`;
};

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

// Get account number: use stored value, or find from build folder
// If multiple exist, prompt user to choose
const getAccountNumber = async (): Promise<string | null> => {
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

// Setup graceful exit handler
const setupExitHandler = () => {
  process.on('SIGINT', () => {
    console.log('\n\nGracefully shutting down...');
    process.exit(0);
  });
};

const loadTransactions = async (): Promise<Transaction[] | null> => {
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

const loadPortfolioData = async (): Promise<PortfolioData | null> => {
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

const showMenu = async (): Promise<void> => {
  while (true) {
    try {
      console.log('\n');
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            {
              name: 'Download Transactions',
              value: MENU_OPTIONS.DOWNLOAD_TRANSACTIONS,
            },
            {
              name: 'Convert Transactions to Portfolio Data',
              value: MENU_OPTIONS.CONVERT_TRANSACTIONS_TO_PORTFOLIO,
            },
            {
              name: 'Convert Portfolio Data to Export Format',
              value: MENU_OPTIONS.CONVERT_TRANSACTIONS,
            },
            {
              name: 'Connect to WebSocket (interact via prompt)',
              value: MENU_OPTIONS.INTERACTIVE_SOCKET_CONNECTION,
            },
            {
              name: 'Exit',
              value: MENU_OPTIONS.EXIT,
            },
          ],
        },
      ]);

      if (action === MENU_OPTIONS.EXIT) {
        process.exit(0);
      }

      if (action === MENU_OPTIONS.DOWNLOAD_TRANSACTIONS) {
        try {
          const wasLoginSuccessful = await login();
          if (!wasLoginSuccessful) {
            console.error('Login failed. Please try again.');
            continue;
          }
          const result = await getTransactions();
          // Store the account number for later use
          accountNumber = result.accountInformation.accountNumber;
          console.log('Transactions downloaded successfully.');
        } catch (error) {
          console.error('Error downloading transactions:', error);
        }
      }

      if (action === MENU_OPTIONS.CONVERT_TRANSACTIONS_TO_PORTFOLIO) {
        try {
          const transactions = await loadTransactions();
          if (!transactions) continue;

          // Get account number (with user selection if multiple exist)
          const accountNum = await getAccountNumber();
          if (!accountNum) {
            console.error(
              'Error: Account number not found. Cannot convert transactions to portfolio data.',
            );
            continue;
          }

          console.log('Converting transactions to portfolio data...');
          const portfolioData = await mapTransactionsToPortfolioData(
            transactions,
            accountNum,
          );

          saveFile(
            JSON.stringify(portfolioData, null, 2),
            'portfolioData.json',
            `build/${accountNum}`,
          );
          console.log('Portfolio data generated successfully.');
        } catch (error) {
          console.error(
            'Error converting transactions to portfolio data:',
            error,
          );
        }
      }

      if (action === MENU_OPTIONS.CONVERT_TRANSACTIONS) {
        try {
          const portfolioData = await loadPortfolioData();
          if (!portfolioData) continue;

          // Get account number (with user selection if multiple exist)
          const accountNum = await getAccountNumber();
          if (!accountNum) {
            console.error(
              'Error: Account number not found. Cannot convert portfolio data.',
            );
            continue;
          }

          // Show available exporters
          const { exporterId } = await inquirer.prompt([
            {
              type: 'list',
              name: 'exporterId',
              message: 'Select an exporter:',
              choices: [
                ...EXPORTERS.map((exporter) => ({
                  name: `${exporter.name}`,
                  value: exporter.id,
                })),
                {
                  name: 'Back to main menu',
                  value: 'back',
                },
              ],
            },
          ]);

          if (exporterId === 'back') continue;

          const exporter = getExporterById(exporterId);
          if (!exporter) {
            console.error(`Error: Exporter with id "${exporterId}" not found.`);
            continue;
          }

          await exporter.convert(portfolioData, accountNum);
          console.log(`Conversion to ${exporter.name} completed successfully.`);
        } catch (error: unknown) {
          // Handle Ctrl+C (SIGINT) gracefully
          if (error instanceof Error && error.name === 'ExitPromptError') {
            console.log('\n\nGracefully shutting down...');
            process.exit(0);
          }

          console.error('Error converting transactions:', error);
        }
      }

      if (action === MENU_OPTIONS.INTERACTIVE_SOCKET_CONNECTION) {
        try {
          const wasLoginSuccessful = await login();
          if (!wasLoginSuccessful) {
            console.error('Login failed. Please try again.');
            continue;
          }
          await interactiveSocketConnection();
          // After interactive session ends, return to menu
        } catch (error) {
          console.error('Error in interactive socket connection:', error);
        }
      }
    } catch (error: unknown) {
      // Handle Ctrl+C (SIGINT) gracefully
      if (error instanceof Error && error.name === 'ExitPromptError') {
        console.log('\n\nGracefully shutting down...');
        process.exit(0);
      }
      throw error;
    }
  }
};

(async () => {
  setupExitHandler();
  await showMenu();
})();
