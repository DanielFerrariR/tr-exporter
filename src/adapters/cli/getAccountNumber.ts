import fs from 'fs';
import inquirer from 'inquirer';

// Find all account numbers by scanning build folder
const findAllAccountNumbers = (): string[] => {
  if (!fs.existsSync('build')) {
    return [];
  }

  const entries = fs.readdirSync('build', { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
};

// Get account number from build folder
// If multiple exist, prompt user to choose
export const getAccountNumber = async (): Promise<string | null> => {
  // Find all account numbers in build folder
  const accountNumbers = findAllAccountNumbers();

  if (accountNumbers.length === 0) {
    return null;
  }

  // If only one exists, use it automatically
  if (accountNumbers.length === 1) {
    return accountNumbers[0];
  }

  // If multiple exist, let user choose
  const { selectedAccountNumber } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedAccountNumber',
      message: 'Multiple account directories found. Please select one:',
      choices: accountNumbers.map((accountNumber) => ({
        name: accountNumber,
        value: accountNumber,
      })),
    },
  ]);

  return selectedAccountNumber;
};
