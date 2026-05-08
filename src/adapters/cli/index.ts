import inquirer from 'inquirer';
import {
  handleConvertTransactions,
  handleConvertTransactionsToPortfolio,
  handleDownloadTransactions,
  handleInteractiveSocketConnection,
  handleChangePhoneNumber,
} from '@/adapters/cli/menuOptions';
import { getPhoneNumber } from '@/adapters/cli/phoneNumberStorage';
import { selectOrAddAccount } from '@/adapters/cli/accountSelection';
import { isDebugMode } from '@/debugMode';

const MENU_OPTIONS = {
  DOWNLOAD_TRANSACTIONS: 'downloadTransactions',
  CONVERT_TRANSACTIONS_TO_PORTFOLIO: 'convertTransactionsToPortfolio',
  CONVERT_TRANSACTIONS: 'convertTransactions',
  INTERACTIVE_SOCKET_CONNECTION: 'interactiveSocketConnection',
  CHANGE_PHONE_NUMBER: 'changePhoneNumber',
  EXIT: 'exit',
} as const;

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
              name: 'Download Transactions and Build Portfolio',
              value: MENU_OPTIONS.DOWNLOAD_TRANSACTIONS,
            },
            ...(isDebugMode
              ? [
                  {
                    name: 'Build Portfolio from Transactions',
                    value: MENU_OPTIONS.CONVERT_TRANSACTIONS_TO_PORTFOLIO,
                  },
                ]
              : []),
            {
              name: 'Export Portfolio',
              value: MENU_OPTIONS.CONVERT_TRANSACTIONS,
            },
            {
              name: 'Connect to WebSocket (interact via prompt)',
              value: MENU_OPTIONS.INTERACTIVE_SOCKET_CONNECTION,
            },
            {
              name: 'Switch Account',
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
      if (error instanceof Error && error.name === 'ExitPromptError') {
        console.log('\n\nGracefully shutting down...');
        process.exit(0);
      }
      throw error;
    }
  }
};

const setupExitHandler = () => {
  process.on('SIGINT', () => {
    console.log('\n\nGracefully shutting down...');
    process.exit(0);
  });
};

export const run = async (): Promise<void> => {
  setupExitHandler();
  await selectOrAddAccount();
  await showMenu();
};
