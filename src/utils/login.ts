import readlineSync from 'readline-sync';
import { TradeRepublicAPI } from '@/api';
import {
  TradeRepublicApiLoginError,
  TradeRepublicApiPinVerificationError,
} from '@/types';

export async function login(): Promise<boolean> {
  console.log('Starting Trade Republic login process...');
  const phoneNumber = readlineSync.question(
    'Please enter your telephone number (with country code, e.g., +491234567890): ',
  );
  const pin = readlineSync.question('Please enter your 4-digit PIN: ');

  let processId: string;

  try {
    console.log('Sending initial login request...');
    const response = await TradeRepublicAPI.getInstance().login({
      phoneNumber,
      pin,
    });

    if (!response.data?.processId) {
      console.error(
        'Initial login response did not contain processId. Response:',
        response.data,
      );
      return false;
    }

    processId = response.data.processId;
    console.log(`Initial login successful. Process ID: ${processId}`);
    console.log(
      `Countdown for Push-Notification PIN: ${response.data.countdownInSeconds} seconds`,
    );
    console.log(`2FA Method: ${response.data['2fa']}`);
  } catch (error: unknown) {
    if (error instanceof TradeRepublicApiLoginError) {
      console.error(`Error during initial login: ${error.message}`);
      console.error('Response data:', error.responseData);
    } else if (error instanceof Error) {
      console.error(
        `An unexpected error occurred during initial login: ${error.message}`,
      );
    } else {
      console.error(
        'An unexpected error occurred during initial login:',
        error,
      );
    }
    return false;
  }

  const pushNotificationPin = readlineSync.question(
    'Please enter the 4-digit PIN you received via Push-Notification: ',
  );

  try {
    console.log(
      `Verifying Push-Notification PIN for process ID: ${processId}...`,
    );
    await TradeRepublicAPI.getInstance().verifyPushNotificationPin({
      processId,
      pushNotificationPin,
    });
    console.log('Push-Notification PIN verification successful.');
    console.error('Login successful.');
    return true;
  } catch (error: unknown) {
    if (error instanceof TradeRepublicApiPinVerificationError) {
      console.error(
        `Error during Push-Notification PIN verification: ${error.message}`,
      );
      console.error('Response data:', error.responseData);
      console.error(
        'Ensure the Push-Notification PIN is correct and entered promptly.',
      );
    } else if (error instanceof Error) {
      console.error(
        `An unexpected error occurred during Push-Notification PIN verification: ${error.message}`,
      );
    } else {
      console.error(
        'An unexpected error occurred during Push-Notification PIN verification:',
        error,
      );
    }
    console.error('Login failed. Exiting.');
    return false;
  }
}
