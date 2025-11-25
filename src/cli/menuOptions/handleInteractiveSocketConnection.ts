import { interactiveSocketConnection } from '@/utils';
import { login } from '@/utils/login';

export const handleInteractiveSocketConnection = async (): Promise<void> => {
  try {
    const wasLoginSuccessful = await login();
    if (!wasLoginSuccessful) {
      console.error('Login failed. Please try again.');
      return;
    }
    await interactiveSocketConnection();
    // After interactive session ends, return to menu
  } catch (error) {
    console.error('Error in interactive socket connection:', error);
  }
};
