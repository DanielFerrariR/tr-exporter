import { EnrichedTransaction } from '@/domain/models';
import { getPhoneNumber } from '@/utils/phoneNumberStorage';
import { login } from '@/adapters/cli/login';
import {
  fetchEnrichedTransactions,
  downloadPdfs,
  restampDividends,
  buildPortfolio,
  type Step,
} from './steps';

export const handleDownloadTransactions = async (): Promise<void> => {
  try {
    const wasLoginSuccessful = await login();
    if (!wasLoginSuccessful) {
      console.error('Login failed. Please try again.');
      return;
    }

    const phoneNumber = getPhoneNumber();
    if (!phoneNumber)
      throw new Error('Phone number is not set. Please set it first.');

    const steps: Step[] = [
      fetchEnrichedTransactions(phoneNumber),
      downloadPdfs(phoneNumber),
      restampDividends(phoneNumber),
      buildPortfolio(phoneNumber),
    ];

    let txs: EnrichedTransaction[] = [];
    for (const step of steps) txs = await step(txs);

    console.log('Transactions downloaded successfully.');
  } catch (error) {
    console.error('Error downloading transactions:', error);
  }
};
