export const FILE_NAME = 'snowballTransactions.csv';
export const EVENT_TYPE_DIVIDEND = 'Dividend';
export const EVENT_TYPE_CASH_GAIN = 'Cash_Gain';
export const EVENT_TYPE_CASH_EXPENSE = 'Cash_Expense';
export const DEFAULT_PRICE_FOR_CASH = '1';
export const EMPTY_STRING = '';

export const HEADERS = [
  'Event',
  'Date',
  'Symbol',
  'Price',
  'Quantity',
  'Currency',
  'FeeTax',
  'Exchange',
  'FeeCurrency',
  'DoNotAdjustCash',
  'Note',
] as const;
