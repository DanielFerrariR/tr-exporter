import { downloadTransactions, login } from '@/utils';

export const handleDownloadTransactions = async (): Promise<void> => {
  try {
    const wasLoginSuccessful = await login();
    if (!wasLoginSuccessful) {
      console.error('Login failed. Please try again.');
      return;
    }
    await downloadTransactions();
    console.log('Transactions downloaded successfully.');
  } catch (error) {
    console.error('Error downloading transactions:', error);
  }
};
