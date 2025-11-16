import fs from 'fs';
import inquirer from 'inquirer';
import { getTransactions, interactiveSocketConnection, login } from './utils';
import { convertTransactionsToSnowballCsv } from './supportedTrackers/snowballAnalytics/convertTransactionsToSnowballCsv';

const MENU_OPTIONS = {
  DOWNLOAD_JSON_AND_CONVERT_TRANSACTIONS_TO_SNOWBALL_CSV:
    'downloadJSONAndConvertToSnowballCsv',
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
          name: 'Download JSON and convert it to Snowball CSV',
          value:
            MENU_OPTIONS.DOWNLOAD_JSON_AND_CONVERT_TRANSACTIONS_TO_SNOWBALL_CSV,
        },
        {
          name: 'Connect to WebSocket (interact via prompt)',
          value: MENU_OPTIONS.INTERACTIVE_SOCKET_CONNECTION,
        },
      ],
    },
  ]);

  if (
    action ===
    MENU_OPTIONS.DOWNLOAD_JSON_AND_CONVERT_TRANSACTIONS_TO_SNOWBALL_CSV
  ) {
    const wasLoginSuccessful = await login();
    if (!wasLoginSuccessful) return;
    const { portfolioData } = await getTransactions();
    await convertTransactionsToSnowballCsv(portfolioData);
    console.log('Conversion to Snowball CSV completed.');
  }

  if (action === MENU_OPTIONS.INTERACTIVE_SOCKET_CONNECTION) {
    const wasLoginSuccessful = await login();
    if (!wasLoginSuccessful) return;
    interactiveSocketConnection();
  }
})();
