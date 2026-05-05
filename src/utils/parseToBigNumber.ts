import { BigNumber } from 'bignumber.js';

export const parseToBigNumber = (value: string | undefined): BigNumber => {
  if (!value) return new BigNumber(0);

  const numericMatch = value.match(/[\d.,]+/);

  if (!numericMatch) {
    return new BigNumber(0);
  }

  const raw = numericMatch[0];
  const lastComma = raw.lastIndexOf(',');
  const lastDot = raw.lastIndexOf('.');

  let sanitized: string;

  // European decimal format: comma is the last separator and is followed by exactly 2 digits
  // e.g. "138,02" → 138.02, "1.234,56" → 1234.56
  if (/,\d{2}$/.test(raw) && lastComma > lastDot) {
    sanitized = raw.replace(/\./g, '').replace(',', '.');
  } else {
    // US format: dots are decimal, commas are thousands separators
    // e.g. "1,234.56" → 1234.56, "157.93" → 157.93, "810" → 810
    sanitized = raw.replace(/,/g, '');
  }

  return new BigNumber(sanitized);
};
