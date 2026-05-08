import readlineSync from 'readline-sync';
import { TradeRepublicAPI } from '@/adapters/tr';
import {
  TradeRepublicApiLoginError,
  TradeRepublicApiLoginProcessError,
} from '@/adapters/tr';
import { getPhoneNumber } from '@/utils/phoneNumberStorage';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000;

export async function login(): Promise<boolean> {
  console.log('Starting Trade Republic login process...');

  const phoneNumber = getPhoneNumber();
  if (!phoneNumber) {
    console.error('Error: Phone number is not set. Please set it first.');
    return false;
  }

  console.log(`Using phone number: ${phoneNumber}`);
  const pin = readlineSync.question('Please enter your 4-digit PIN: ', {
    hideEchoBack: true,
    mask: '',
  });

  let processId: string;

  try {
    console.log('Sending login request...');
    const response = await TradeRepublicAPI.getInstance().login({
      phoneNumber,
      pin,
    });

    if (!response.data?.processId) {
      console.error(
        'Login response did not contain processId. Response:',
        response.data,
      );
      return false;
    }

    processId = response.data.processId;
    console.log(
      'Please approve the login request in your Trade Republic app...',
    );
  } catch (error: unknown) {
    if (error instanceof TradeRepublicApiLoginError) {
      console.error(`Error during login: ${error.message}`);
      console.error('Response data:', error.responseData);
    } else if (error instanceof Error) {
      console.error(
        `An unexpected error occurred during login: ${error.message}`,
      );
    } else {
      console.error('An unexpected error occurred during login:', error);
    }
    return false;
  }

  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    try {
      const result =
        await TradeRepublicAPI.getInstance().pollLoginProcess(processId);

      if (result.status === 'CONFIRMED') {
        console.log('Login successful.');
        return true;
      }

      if (result.status === 'DENIED') {
        console.error('Login was denied in the app.');
        return false;
      }

      if (result.status === 'EXPIRED') {
        console.error('Login request expired. Please try again.');
        return false;
      }

      // PENDING — keep polling
    } catch (error: unknown) {
      if (error instanceof TradeRepublicApiLoginProcessError) {
        console.error(`Error polling login status: ${error.message}`);
        console.error('Response data:', error.responseData);
      } else if (error instanceof Error) {
        console.error(
          `An unexpected error occurred while polling: ${error.message}`,
        );
      } else {
        console.error('An unexpected error occurred while polling:', error);
      }
      return false;
    }
  }

  console.error(
    'Login timed out. The request was not approved within 2 minutes.',
  );
  return false;
}
