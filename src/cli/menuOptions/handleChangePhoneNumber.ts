import inquirer from 'inquirer';
import { setPhoneNumber } from '@/utils/phoneNumberStorage';

export const handleChangePhoneNumber = async (): Promise<void> => {
  const { phoneNumber } = await inquirer.prompt([
    {
      type: 'input',
      name: 'phoneNumber',
      message: 'Enter your phone number:',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Phone number cannot be empty';
        }
        return true;
      },
    },
  ]);
  setPhoneNumber(phoneNumber.trim());
  console.log('Phone number updated successfully.');
};
