import { getPhoneNumber } from '@/adapters/cli/phoneNumberStorage';
import { login } from '@/adapters/cli/login';
import { downloadPortfolio } from '@/application/downloadPortfolio';

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

    await downloadPortfolio(phoneNumber);
    console.log('Transactions downloaded successfully.');
  } catch (error) {
    console.error('Error downloading transactions:', error);
  }
};
