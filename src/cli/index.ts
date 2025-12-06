import inquirer from 'inquirer';
import {
  handleConvertTransactions,
  handleConvertTransactionsToPortfolio,
  handleDownloadTransactions,
  handleInteractiveSocketConnection,
  handleChangePhoneNumber,
} from '@/cli/menuOptions';
import {
  getPhoneNumber,
  setPhoneNumber,
  hasPhoneNumber,
} from '@/utils/phoneNumberStorage';

const MENU_OPTIONS = {
  DOWNLOAD_TRANSACTIONS: 'downloadTransactions',
  CONVERT_TRANSACTIONS_TO_PORTFOLIO: 'convertTransactionsToPortfolio',
  CONVERT_TRANSACTIONS: 'convertTransactions',
  INTERACTIVE_SOCKET_CONNECTION: 'interactiveSocketConnection',
  CHANGE_PHONE_NUMBER: 'changePhoneNumber',
  EXIT: 'exit',
} as const;

const promptPhoneNumber = async (): Promise<void> => {
  const { phoneNumber } = await inquirer.prompt([
    {
      type: 'input',
      name: 'phoneNumber',
      message: 'Enter your phone number:',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Phone number cannot be empty';
        }
        return true;
      },
    },
  ]);
  setPhoneNumber(phoneNumber.trim());
};

const showMenu = async (): Promise<void> => {
  while (true) {
    try {
      const currentPhoneNumber = getPhoneNumber();

      console.log('\n');
      if (currentPhoneNumber) {
        console.log(`Your current phone number is: ${currentPhoneNumber}`);
      }
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
              name: 'Change Phone Number',
              value: MENU_OPTIONS.CHANGE_PHONE_NUMBER,
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

      if (action === MENU_OPTIONS.CHANGE_PHONE_NUMBER) {
        await handleChangePhoneNumber();
        continue;
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

// Setup graceful exit handler
const setupExitHandler = () => {
  process.on('SIGINT', () => {
    console.log('\n\nGracefully shutting down...');
    process.exit(0);
  });
};

export const run = async (): Promise<void> => {
  setupExitHandler();

  // Ask for phone number first if not set
  if (!hasPhoneNumber()) {
    await promptPhoneNumber();
  }

  await showMenu();
};
