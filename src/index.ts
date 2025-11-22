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

const TRANSACTIONS_PATH = 'build/transactions.json';
const PORTFOLIO_DATA_PATH = 'build/portfolioData.json';

// Setup graceful exit handler
const setupExitHandler = () => {
  process.on('SIGINT', () => {
    console.log('\n\nGracefully shutting down...');
    process.exit(0);
  });
};

const loadTransactions = (): Transaction[] | null => {
  if (!fs.existsSync(TRANSACTIONS_PATH)) {
    console.error(`Error: ${TRANSACTIONS_PATH} not found.`);
    console.error(
      'Please download transactions first using option 1 before converting.',
    );
    return null;
  }

  try {
    console.log(`Reading transactions from ${TRANSACTIONS_PATH}...`);
    return JSON.parse(fs.readFileSync(TRANSACTIONS_PATH, 'utf8'));
  } catch (error) {
    console.error(`Error reading ${TRANSACTIONS_PATH}:`, error);
    return null;
  }
};

const loadPortfolioData = (): PortfolioData | null => {
  if (!fs.existsSync(PORTFOLIO_DATA_PATH)) {
    console.error(`Error: ${PORTFOLIO_DATA_PATH} not found.`);
    console.error(
      'Please convert transactions to portfolio data first using option 2.',
    );
    return null;
  }

  try {
    console.log(`Reading portfolio data from ${PORTFOLIO_DATA_PATH}...`);
    return JSON.parse(fs.readFileSync(PORTFOLIO_DATA_PATH, 'utf8'));
  } catch (error) {
    console.error(`Error reading ${PORTFOLIO_DATA_PATH}:`, error);
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
          await getTransactions();
          console.log('Transactions downloaded successfully.');
        } catch (error) {
          console.error('Error downloading transactions:', error);
        }
      }

      if (action === MENU_OPTIONS.CONVERT_TRANSACTIONS_TO_PORTFOLIO) {
        try {
          const transactions = loadTransactions();
          if (!transactions) continue;

          console.log('Converting transactions to portfolio data...');
          const portfolioData = await mapTransactionsToPortfolioData(
            transactions,
            false,
          );

          saveFile(
            JSON.stringify(portfolioData, null, 2),
            'portfolioData.json',
            'build',
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
          const portfolioData = loadPortfolioData();
          if (!portfolioData) continue;

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

          await exporter.convert(portfolioData);
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
