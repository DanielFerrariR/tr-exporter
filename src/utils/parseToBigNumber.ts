import BigNumber from 'bignumber.js';

export const parseToBigNumber = (value: string): BigNumber => {
  const sanitizedValue = value.replace(/,/g, '');
  return new BigNumber(sanitizedValue);
};
