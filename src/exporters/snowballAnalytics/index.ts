import {
  CashTransaction,
  DividendTransaction,
  OrderTransaction,
  PortfolioData,
  SplitTransaction,
  TRANSACTION_TYPE,
} from '@/types';
import { saveFile } from '@/utils/saveFile';
import { TRANSACTION_EVENT_TYPE } from '@/constants';
import { getExchangeFromIsin, parseToBigNumber } from '@/utils';

const FILE_NAME = 'snowballTransactions.csv';
const EVENT_TYPE_DIVIDEND = 'Dividend';
const EVENT_TYPE_CASH_GAIN = 'Cash_Gain';
const EVENT_TYPE_CASH_EXPENSE = 'Cash_Expense';
const EVENT_TYPE_SPLIT = 'Split';
const DEFAULT_PRICE_FOR_CASH = '1';
const EMPTY_STRING = '';
const DEFAULT_EXCHANGE = 'LS-X';
const DEFAULT_CURRENCY = 'EUR';

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

export const escapeCsvField = (field: string): string => {
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
};

export const createCsvRow = (fields: string[]): string => {
  return fields.map((field) => escapeCsvField(field ?? EMPTY_STRING)).join(',');
};

// Transaction type handlers
export interface CsvRowData {
  event: string;
  date: string;
  symbol: string;
  price: string;
  quantity: string;
  currency: string;
  feeTax: string;
  exchange: string;
  feeCurrency: string;
  doNotAdjustCash: string;
  note: string;
}

export const isRowEmpty = (row: CsvRowData): boolean => {
  return Object.values(row).every((field) => !field);
};

export const handleDividend = async (
  item: DividendTransaction,
): Promise<CsvRowData> => {
  // If exchange is not the default exchange, use the exchange from the item
  const exchange =
    item.exchange !== DEFAULT_EXCHANGE
      ? item.exchange
      : await getExchangeFromIsin(item.isin);

  return {
    event: EVENT_TYPE_DIVIDEND,
    date: item.date,
    symbol: item.isin,
    exchange,
    note: item.title,
    quantity: item.dividendTotal,
    price: item.dividendPerShare,
    currency: item.currency,
    feeTax: item.tax,
    feeCurrency: item.taxCurrency,
    doNotAdjustCash: EMPTY_STRING,
  };
};

export const handleOrderTransaction = async (
  item: OrderTransaction,
): Promise<CsvRowData> => {
  // If exchange is not the default exchange, use the exchange from the item
  const exchange =
    item.exchange !== DEFAULT_EXCHANGE
      ? item.exchange
      : await getExchangeFromIsin(item.isin);

  return {
    event: item.type,
    date: item.date,
    symbol: item.isin,
    exchange,
    note: item.title,
    quantity: item.quantity,
    price: item.price,
    currency: item.currency,
    feeTax: item.fee,
    feeCurrency: item.feeCurrency,
    doNotAdjustCash: EMPTY_STRING,
  };
};

export const handleCashTransaction = (item: CashTransaction): CsvRowData => {
  const event =
    item.type === TRANSACTION_TYPE.CASH_GAIN
      ? EVENT_TYPE_CASH_GAIN
      : EVENT_TYPE_CASH_EXPENSE;

  return {
    event,
    date: item.date,
    symbol: EMPTY_STRING,
    exchange: EMPTY_STRING,
    note: item.title,
    quantity: item.amount,
    price: DEFAULT_PRICE_FOR_CASH,
    currency: item.currency,
    feeTax: item.tax,
    feeCurrency: item.taxCurrency,
    doNotAdjustCash: EMPTY_STRING,
  };
};

export const handleSplitTransaction = (item: SplitTransaction): CsvRowData => {
  return {
    event: EVENT_TYPE_SPLIT,
    date: item.date,
    symbol: item.isin,
    exchange: EMPTY_STRING,
    note: item.title,
    quantity: item.creditedShares,
    price: parseToBigNumber(item.creditedShares)
      .dividedBy(parseToBigNumber(item.debitedShares))
      .toFixed(),
    currency: DEFAULT_CURRENCY, // Snowball requires currency for splits
    feeTax: EMPTY_STRING,
    feeCurrency: EMPTY_STRING,
    doNotAdjustCash: EMPTY_STRING,
  };
};

export const convertItemToCsvRow = async (
  item: PortfolioData[0],
): Promise<CsvRowData | null> => {
  try {
    // Dividends
    if (item.eventType === TRANSACTION_EVENT_TYPE.DIVIDEND) {
      return await handleDividend(item);
    }

    // Buy and Sell transactions (trades, savings plans, roundups and 15 euros per month bonus)
    if (
      item.eventType === TRANSACTION_EVENT_TYPE.TRADE ||
      item.eventType === TRANSACTION_EVENT_TYPE.SAVINGS_PLAN ||
      item.eventType === TRANSACTION_EVENT_TYPE.ROUNDUP ||
      item.eventType === TRANSACTION_EVENT_TYPE.CASHBACK ||
      item.eventType === TRANSACTION_EVENT_TYPE.WELCOME_STOCK_GIFT ||
      item.eventType === TRANSACTION_EVENT_TYPE.RECEIVED_GIFT ||
      item.eventType === TRANSACTION_EVENT_TYPE.GIVE_AWAY_GIFT
    ) {
      return await handleOrderTransaction(item);
    }

    // Cash Gain and Cash Expense
    if (
      item.eventType === TRANSACTION_EVENT_TYPE.INTEREST ||
      item.eventType === TRANSACTION_EVENT_TYPE.TAX_CORRECTION ||
      item.eventType === TRANSACTION_EVENT_TYPE.TAX
    ) {
      return handleCashTransaction(item);
    }

    // Split
    if (item.eventType === TRANSACTION_EVENT_TYPE.SPLIT) {
      return handleSplitTransaction(item);
    }

    // Unhandled event types are silently ignored
    return null;
  } catch (error) {
    console.error(
      `Error converting transaction ${item.title} to CSV row:`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
};

export const convertTransactionsToSnowballCsv = async (
  data: PortfolioData,
  accountNumber: string,
): Promise<void> => {
  if (!data?.length) {
    console.warn(
      'No data provided to convert to CSV. No file will be created.',
    );
    return;
  }

  console.log('Converting transactions to Snowball CSV format...');

  // Convert all items to CSV rows in parallel (where possible)
  // Note: getExchangeFromIsin has internal caching, so parallel calls are efficient
  const csvRowPromises = data.map(convertItemToCsvRow);
  const csvRowResults = await Promise.all(csvRowPromises);

  // Filter out null results and empty rows, then convert to CSV format
  const csvRows: string[] = [HEADERS.join(',')];

  for (const row of csvRowResults) {
    if (row && !isRowEmpty(row)) {
      const rowArray = [
        row.event,
        row.date,
        row.symbol,
        row.price,
        row.quantity,
        row.currency,
        row.feeTax,
        row.exchange,
        row.feeCurrency,
        row.doNotAdjustCash,
        row.note,
      ];
      csvRows.push(createCsvRow(rowArray));
    }
  }

  const csvString = csvRows.join('\n');
  saveFile(csvString, FILE_NAME, `build/${accountNumber}`);
};
