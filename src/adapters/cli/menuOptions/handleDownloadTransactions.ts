import { getPhoneNumber } from '@/adapters/cli/phoneNumberStorage';
import { login } from '@/adapters/cli/login';
import { downloadPortfolio } from '@/application/downloadPortfolio';
import { consola } from 'consola';

export const handleDownloadTransactions = async (): Promise<void> => {
  try {
    const wasLoginSuccessful = await login();
    if (!wasLoginSuccessful) {
      consola.error('Login failed. Please try again.');
      return;
    }

    const phoneNumber = getPhoneNumber();
    if (!phoneNumber)
      throw new Error('Phone number is not set. Please set it first.');

    await downloadPortfolio(phoneNumber);
    consola.info('Transactions downloaded successfully.');
  } catch (error) {
    consola.error('Error downloading transactions:', error);
  }
};
