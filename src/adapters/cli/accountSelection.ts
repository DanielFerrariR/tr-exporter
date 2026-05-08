import inquirer from 'inquirer';
import {
  getAccounts,
  getLastUsedPhoneNumber,
  saveAccount,
  setPhoneNumber,
} from './phoneNumberStorage';

const ADD_NEW = '__add_new__';

const promptNewAccount = async (): Promise<void> => {
  const { phoneNumber } = await inquirer.prompt([
    {
      type: 'input',
      name: 'phoneNumber',
      message: 'Enter your phone number:',
      validate: (input: string) =>
        input.trim().length > 0 || 'Phone number cannot be empty',
    },
  ]);

  const { label } = await inquirer.prompt([
    {
      type: 'input',
      name: 'label',
      message: 'Label for this account (optional, press Enter to skip):',
    },
  ]);

  const trimmedPhone = phoneNumber.trim();
  const trimmedLabel = label.trim() || undefined;
  saveAccount(trimmedPhone, trimmedLabel);
  setPhoneNumber(trimmedPhone);
};

export const selectOrAddAccount = async (): Promise<void> => {
  const accounts = getAccounts();

  if (accounts.length === 0) {
    await promptNewAccount();
    return;
  }

  const lastUsed = getLastUsedPhoneNumber();

  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: 'Select an account:',
      default: lastUsed ?? accounts[0].phoneNumber,
      choices: [
        ...accounts.map((account) => ({
          name: account.label
            ? `${account.label} (${account.phoneNumber})`
            : account.phoneNumber,
          value: account.phoneNumber,
        })),
        new inquirer.Separator(),
        { name: 'Add new account', value: ADD_NEW },
      ],
    },
  ]);

  if (selected === ADD_NEW) {
    await promptNewAccount();
    return;
  }

  saveAccount(selected);
  setPhoneNumber(selected);
};
