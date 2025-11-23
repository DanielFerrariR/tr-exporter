import BigNumber from 'bignumber.js';

export const parseToBigNumber = (value: string | undefined): BigNumber => {
  // Extract numeric values in format 0,00 or 0.00 or 0 (absolute value only)
  const numericMatch = value?.match(/\d+([.,]\d+)?/);
  const sanitizedValue = numericMatch
    ? numericMatch[0].replace(/,/g, '.')
    : '0';
  return new BigNumber(sanitizedValue);
};
