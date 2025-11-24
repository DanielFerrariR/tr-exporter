import inquirer from 'inquirer';
import {
  downloadTransactions,
  interactiveSocketConnection,
  EXPORTERS,
  getExporterById,
} from '@/features';
import { mapTransactionsToPortfolioData, saveFile } from '@/utils';
import { login } from '@/cli/login';
import { MENU_OPTIONS } from '@/cli/constants';
import {
  getAccountNumber,
  loadPortfolioData,
  loadTransactions,
  setAccountNumber,
} from '@/cli/helpers';

const handleDownloadTransactions = async (): Promise<void> => {
  try {
    const wasLoginSuccessful = await login();
    if (!wasLoginSuccessful) {
      console.error('Login failed. Please try again.');
      return;
    }
    const result = await downloadTransactions();
    // Store the account number for later use
    setAccountNumber(result.accountInformation.accountNumber);
    console.log('Transactions downloaded successfully.');
  } catch (error) {
    console.error('Error downloading transactions:', error);
  }
};

const handleConvertTransactionsToPortfolio = async (): Promise<void> => {
  try {
    const transactions = await loadTransactions();
    if (!transactions) return;

    // Get account number (with user selection if multiple exist)
    const accountNum = await getAccountNumber();
    if (!accountNum) {
      console.error(
        'Error: Account number not found. Cannot convert transactions to portfolio data.',
      );
      return;
    }

    console.log('Converting transactions to portfolio data...');
    const portfolioData = mapTransactionsToPortfolioData(transactions);

    saveFile(
      JSON.stringify(portfolioData, null, 2),
      'portfolioData.json',
      `build/${accountNum}`,
    );
    console.log('Portfolio data generated successfully.');
  } catch (error) {
    console.error('Error converting transactions to portfolio data:', error);
  }
};

const handleConvertTransactions = async (): Promise<void> => {
  try {
    const portfolioData = await loadPortfolioData();
    if (!portfolioData) return;

    // Get account number (with user selection if multiple exist)
    const accountNum = await getAccountNumber();
    if (!accountNum) {
      console.error(
        'Error: Account number not found. Cannot convert portfolio data.',
      );
      return;
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

    if (exporterId === 'back') return;

    const exporter = getExporterById(exporterId);
    if (!exporter) {
      console.error(`Error: Exporter with id "${exporterId}" not found.`);
      return;
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
};

const handleInteractiveSocketConnection = async (): Promise<void> => {
  try {
    const wasLoginSuccessful = await login();
    if (!wasLoginSuccessful) {
      console.error('Login failed. Please try again.');
      return;
    }
    await interactiveSocketConnection();
    // After interactive session ends, return to menu
  } catch (error) {
    console.error('Error in interactive socket connection:', error);
  }
};

export const showMenu = async (): Promise<void> => {
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
        await handleDownloadTransactions();
      }

      if (action === MENU_OPTIONS.CONVERT_TRANSACTIONS_TO_PORTFOLIO) {
        await handleConvertTransactionsToPortfolio();
      }

      if (action === MENU_OPTIONS.CONVERT_TRANSACTIONS) {
        await handleConvertTransactions();
      }

      if (action === MENU_OPTIONS.INTERACTIVE_SOCKET_CONNECTION) {
        await handleInteractiveSocketConnection();
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
