import { saveFile } from '@/utils/saveFile';
import {
  Transaction,
  TransactionDetailsResponse,
  TransactionResponse,
  Activity,
  ActivityResponse,
  PortfolioData,
  AccountInformation,
  SplitMessage,
} from '@/types';
import { TradeRepublicAPI } from '@/api';
import { RECEIVED_COMMAND_TYPES, SUBSCRIPTION_TYPES } from '@/constants';
import { mapTransactionsToPortfolioData } from '@/utils/mapTransactionsToPortfolioData';
import { CloseEvent, ErrorEvent } from 'ws';
import { getGiftTransactions } from '@/utils/getGiftTransactions';
import { identifyActivityEventType } from '@/utils/identifyActivityEventType';
import { identifyTransactionEventType } from '@/utils/identifyTransactionEventType';
import { getCorporateActionsTransactions } from '@/utils/getCorporateActionsTransactions';
import { getPhoneNumber } from '@/utils/phoneNumberStorage';

export const OUTPUT_DIRECTORY = 'build';
export const TRANSACTIONS_FILE_NAME = 'transactions.json';
export const ACTIVITIES_FILE_NAME = 'activities.json';
export const ACCOUNT_INFORMATION_FILE_NAME = 'accountInformation.json';
export const PORTFOLIO_DATA_FILE_NAME = 'portfolioData.json';

export const downloadTransactions = async (): Promise<{
  transactions: Transaction[];
  activities: Activity[];
  portfolioData: PortfolioData;
  accountInformation: AccountInformation;
}> =>
  new Promise((resolve, reject) => {
    const phoneNumber = getPhoneNumber();
    if (!phoneNumber) {
      reject(new Error('Phone number is not set. Please set it first.'));
      return;
    }

    const accountInformation: AccountInformation = {
      accountNumber: '',
      currencyId: 'EUR',
      amount: '',
    };
    let activities: Activity[] = [];
    let transactions: Transaction[] = [];
    const transactionsToFetchDetailsFor = new Set<string>();

    TradeRepublicAPI.getInstance().connect({
      onOpen: () => {
        console.log('WebSocket connection opened.');
      },
      onConnected: () => {
        try {
          console.log('Received "connected" message from server.');
          console.log('\n--- WebSocket Ready ---');
          console.log('Starting to fetch the account details...');

          TradeRepublicAPI.getInstance().sendSubscriptionMessage(
            SUBSCRIPTION_TYPES.CASH,
          );
        } catch (error) {
          console.error('Error during initial connection:', error);
          reject(error);
        }
      },
      onMessage: async (
        message: string,
        { command, jsonPayload, subscription }: SplitMessage,
      ) => {
        // We don't want to see logs of keep-alive messages
        if (command === RECEIVED_COMMAND_TYPES.KEEP_ALIVE) return;

        // Just to debug because we don't expect any message that isn't a activity, transaction,
        // transactionDetails or keep-alive here
        if (!jsonPayload) {
          console.log(`Received message: ${message}`);
          return;
        }

        if (subscription?.type === SUBSCRIPTION_TYPES.CASH) {
          try {
            const cashResponse = jsonPayload as AccountInformation;
            // Update accountInformation with the received data
            accountInformation.accountNumber = cashResponse.accountNumber;
            accountInformation.currencyId = cashResponse.currencyId;
            accountInformation.amount = cashResponse.amount;

            console.log('Account information fetched.');

            // Save account information to phone number folder
            saveFile(
              JSON.stringify(accountInformation, null, 2),
              ACCOUNT_INFORMATION_FILE_NAME,
              `${OUTPUT_DIRECTORY}/${phoneNumber}`,
            );
            TradeRepublicAPI.getInstance().sendSubscriptionMessage(
              SUBSCRIPTION_TYPES.ACTIVITIES,
            );
            console.log('Sent initial activity request.');
            return;
          } catch (error) {
            console.error('Error processing cash message:', message);
            reject(error);
          }
        }

        if (subscription?.type === SUBSCRIPTION_TYPES.ACTIVITIES) {
          try {
            const activityResponse = jsonPayload as ActivityResponse;
            activities = activities.concat(activityResponse.items);

            const after = activityResponse.cursors.after;
            if (after) {
              TradeRepublicAPI.getInstance().sendSubscriptionMessage(
                SUBSCRIPTION_TYPES.ACTIVITIES,
                { after },
              );
              return;
            }

            // Identify activity event types
            activities = activities.map((activity) => ({
              ...activity,
              eventType: identifyActivityEventType(activity),
            }));

            console.log('All activities fetched.');
            saveFile(
              JSON.stringify(activities, null, 2),
              ACTIVITIES_FILE_NAME,
              `${OUTPUT_DIRECTORY}/${phoneNumber}`,
            );
            TradeRepublicAPI.getInstance().sendSubscriptionMessage(
              SUBSCRIPTION_TYPES.TRANSACTIONS,
            );
            console.log('Sent initial transactions request.');
          } catch (error) {
            console.error('Error processing activity message:', message);
            reject(error);
          }
        }

        if (subscription?.type === SUBSCRIPTION_TYPES.TRANSACTIONS) {
          try {
            const transactionResponse = jsonPayload as TransactionResponse;
            transactions.push(...transactionResponse.items);

            const after = transactionResponse.cursors.after;
            if (after) {
              TradeRepublicAPI.getInstance().sendSubscriptionMessage(
                SUBSCRIPTION_TYPES.TRANSACTIONS,
                { after },
              );
              return;
            }

            // Identify transaction event types
            transactions = transactions.map((transaction) => ({
              ...transaction,
              eventType: identifyTransactionEventType(transaction),
            }));

            // Adding received gift transactions from activities as transactions list doesn't include received gifts
            const giftTransactions: Transaction[] =
              getGiftTransactions(activities);
            // Adding corporate actions transactions from activities as transactions list doesn't include them
            const corporateActionsTransactions: Transaction[] =
              getCorporateActionsTransactions(activities);

            transactions.push(
              ...giftTransactions,
              ...corporateActionsTransactions,
            );
            transactions.sort(
              (transactionA, transactionB) =>
                new Date(transactionB.timestamp).getTime() -
                new Date(transactionA.timestamp).getTime(),
            );

            console.log('All transactions fetched.');
            console.log('Starting to fetch details for each transaction.');
            for (const transaction of transactions) {
              transactionsToFetchDetailsFor.add(transaction.id);
            }
            for (const transaction of transactions) {
              TradeRepublicAPI.getInstance().sendSubscriptionMessage(
                SUBSCRIPTION_TYPES.TRANSACTION_DETAILS,
                { id: transaction.id },
              );
            }
          } catch (error) {
            console.error('Error processing transaction message:', message);
            reject(error);
          }
        }

        if (
          subscription?.type === SUBSCRIPTION_TYPES.TRANSACTION_DETAILS &&
          subscription.id
        ) {
          try {
            const transactionDetailsResponse =
              jsonPayload as TransactionDetailsResponse;

            const transactionIndex = transactions.findIndex(
              (item) => item.id === subscription.id,
            );

            if (transactionIndex === -1) {
              console.warn(
                `Received details for unknown transaction ID: ${subscription.id}`,
              );
              return;
            }

            const transaction = transactions[transactionIndex];

            transaction.sections = transactionDetailsResponse.sections;
            transactionsToFetchDetailsFor.delete(subscription.id);

            if (transactionsToFetchDetailsFor.size !== 0) return;

            console.log('All transaction details fetched.');
            saveFile(
              JSON.stringify(transactions, null, 2),
              TRANSACTIONS_FILE_NAME,
              `${OUTPUT_DIRECTORY}/${phoneNumber}`,
            );

            console.log('Generating portfolio data...');
            const portfolioData: PortfolioData =
              mapTransactionsToPortfolioData(transactions);

            saveFile(
              JSON.stringify(portfolioData, null, 2),
              PORTFOLIO_DATA_FILE_NAME,
              `${OUTPUT_DIRECTORY}/${phoneNumber}`,
            );

            TradeRepublicAPI.getInstance().disconnect();
            resolve({
              transactions,
              activities,
              portfolioData,
              accountInformation,
            });
          } catch (error) {
            console.error(
              'Error processing transaction details message:',
              message,
            );
            reject(error);
          }
        }
      },
      onClose: (event: CloseEvent) => {
        // Code 1000 is normal closure
        // Code 1001 is "going away"
        // Codes 1002-1015 are various error conditions
        const isNormalClosure = event.code === 1000 || event.code === 1001;

        if (!isNormalClosure) {
          const errorMessage = `WebSocket connection closed unexpectedly: Code ${event.code}, Reason: ${event.reason || 'No reason provided'}`;
          console.error(errorMessage);
          reject(new Error(errorMessage));
        }
      },
      onError: (error: ErrorEvent) => {
        console.error('WebSocket error:', error);
        reject(error);
      },
    });
  });
