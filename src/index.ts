import fs from 'fs';
import inquirer from 'inquirer';
import { getTransactions, interactiveSocketConnection, login } from './utils';
import { EXPORTERS, getExporterById } from './exporters';
import { PortfolioData } from './types';

const MENU_OPTIONS = {
  DOWNLOAD_TRANSACTIONS: 'downloadTransactions',
  CONVERT_TRANSACTIONS: 'convertTransactions',
  INTERACTIVE_SOCKET_CONNECTION: 'interactiveSocketConnection',
  EXIT: 'exit',
};

const PORTFOLIO_DATA_PATH = 'build/portfolioData.json';

// Setup graceful exit handler
const setupExitHandler = () => {
  process.on('SIGINT', () => {
    console.log('\n\nGracefully shutting down...');
    process.exit(0);
  });
};

const loadPortfolioData = (): PortfolioData | null => {
  if (!fs.existsSync(PORTFOLIO_DATA_PATH)) {
    console.error(`Error: ${PORTFOLIO_DATA_PATH} not found.`);
    console.error(
      'Please download transactions first using option 1 before converting.',
    );
    return null;
  }

  try {
    console.log(`Reading transactions from ${PORTFOLIO_DATA_PATH}...`);
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
              name: 'Convert Downloaded Transactions',
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
        } catch (error: any) {
          // Handle Ctrl+C (SIGINT) gracefully
          if (error.name === 'ExitPromptError') {
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
    } catch (error: any) {
      // Handle Ctrl+C (SIGINT) gracefully
      if (error.name === 'ExitPromptError') {
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
