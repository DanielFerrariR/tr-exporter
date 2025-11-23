import fs from 'fs';

export const getTransactionsPath = (accountNum: string): string => {
  return `build/${accountNum}/transactions.json`;
};

export const getPortfolioDataPath = (accountNum: string): string => {
  return `build/${accountNum}/portfolioData.json`;
};

// Find all account numbers by scanning build folder
export const findAllAccountNumbers = (): string[] => {
  if (!fs.existsSync('build')) {
    return [];
  }

  const entries = fs.readdirSync('build', { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
};
