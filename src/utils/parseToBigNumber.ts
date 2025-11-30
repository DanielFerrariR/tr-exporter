import { BigNumber } from 'bignumber.js';

export const parseToBigNumber = (value: string | undefined): BigNumber => {
  if (!value) return new BigNumber(0);

  // Extract all digits, commas, and dots
  const numericMatch = value.match(/[\d.,]+/);

  if (!numericMatch) {
    return new BigNumber(0);
  }

  // Remove all commas (thousands separators) and keep dots (decimal separators)
  const sanitizedValue = numericMatch[0].replace(/,/g, '');

  return new BigNumber(sanitizedValue);
};
