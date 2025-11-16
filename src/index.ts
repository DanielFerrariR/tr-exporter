import fs from 'fs';
import inquirer from 'inquirer';
import { getTransactions, interactiveSocketConnection, login } from './utils';
import { convertTransactionsToSnowballCsv } from './exporters/snowballAnalytics/convertTransactionsToSnowballCsv';

const MENU_OPTIONS = {
  DOWNLOAD_TRANSACTIONS: 'downloadTransactions',
  DOWNLOAD_TRANSACTIONS_AND_CONVERT_TRANSACTIONS_TO_SNOWBALL_CSV:
    'downloadJSONAndConvertToSnowballCsv',
  IMPORT_AND_CONVERT_TRANSACTIONS_TO_SNOWBALL_CSV:
    'importAndConvertToSnowballCsv',
  INTERACTIVE_SOCKET_CONNECTION: 'interactiveSocketConnection',
};

(async () => {
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
          name: 'Download Transactions and convert it to Snowball CSV',
          value:
            MENU_OPTIONS.DOWNLOAD_TRANSACTIONS_AND_CONVERT_TRANSACTIONS_TO_SNOWBALL_CSV,
        },
        {
          name: 'Import existing JSON and convert it to Snowball CSV',
          value: MENU_OPTIONS.IMPORT_AND_CONVERT_TRANSACTIONS_TO_SNOWBALL_CSV,
        },
        {
          name: 'Connect to WebSocket (interact via prompt)',
          value: MENU_OPTIONS.INTERACTIVE_SOCKET_CONNECTION,
        },
      ],
    },
  ]);

  if (action === MENU_OPTIONS.DOWNLOAD_TRANSACTIONS) {
    const wasLoginSuccessful = await login();
    if (!wasLoginSuccessful) return;
    await getTransactions();
    console.log('Transactions downloaded successfully.');
  }

  if (
    action ===
    MENU_OPTIONS.DOWNLOAD_TRANSACTIONS_AND_CONVERT_TRANSACTIONS_TO_SNOWBALL_CSV
  ) {
    const wasLoginSuccessful = await login();
    if (!wasLoginSuccessful) return;
    const { portfolioData } = await getTransactions();
    await convertTransactionsToSnowballCsv(portfolioData);
    console.log('Conversion to Snowball CSV completed.');
  }

  if (action === MENU_OPTIONS.IMPORT_AND_CONVERT_TRANSACTIONS_TO_SNOWBALL_CSV) {
    try {
      const jsonFilePath = 'build/transactions.json';
      if (!fs.existsSync(jsonFilePath)) {
        console.error(`Error: ${jsonFilePath} not found.`);
        console.error(
          'Please ensure you have previously saved your transactions data to this file, perhaps from a prior socket interaction.',
        );
        return;
      }
      console.log(`Reading transactions from ${jsonFilePath}...`);
      const transactionsJson = JSON.parse(
        fs.readFileSync(jsonFilePath, 'utf8'),
      );
      await convertTransactionsToSnowballCsv(transactionsJson);
      console.log('Conversion to Snowball CSV completed.');
    } catch (error) {
      console.error('Error converting to Snowball CSV:', error);
    }
  }

  if (action === MENU_OPTIONS.INTERACTIVE_SOCKET_CONNECTION) {
    const wasLoginSuccessful = await login();
    if (!wasLoginSuccessful) return;
    interactiveSocketConnection();
  }
})();
