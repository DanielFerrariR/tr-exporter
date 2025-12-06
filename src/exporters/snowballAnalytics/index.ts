import {
  DividendTransaction,
  CashTransaction,
  OrderTransaction,
  PortfolioData,
  SplitTransaction,
  TRANSACTION_TYPE,
} from '@/types';
import { saveFile } from '@/utils/saveFile';
import { TRANSACTION_EVENT_TYPE } from '@/constants';
import { getExchangeFromIsin, parseToBigNumber } from '@/utils';

// Constants
const OUTPUT_DIRECTORY = 'build';
const FILE_NAME = 'snowballTransactions.csv';
const DISABLED_PRICE_FOR_CASH_GAIN_AND_EXPENSES = '1';
const DEFAULT_EXCHANGE = 'LS-X';
const DEFAULT_CURRENCY = 'EUR';

// Event types
const EVENT_TYPE_DIVIDEND = 'Dividend';
const EVENT_TYPE_BUY = 'Buy';
const EVENT_TYPE_SELL = 'Sell';
const EVENT_TYPE_CASH_GAIN = 'Cash_Gain';
const EVENT_TYPE_CASH_EXPENSE = 'Cash_Expense';
const EVENT_TYPE_SPLIT = 'Split';

// Type map
const TYPE_MAP = {
  [TRANSACTION_TYPE.BUY]: EVENT_TYPE_BUY,
  [TRANSACTION_TYPE.SELL]: EVENT_TYPE_SELL,
  [TRANSACTION_TYPE.CASH_GAIN]: EVENT_TYPE_CASH_GAIN,
  [TRANSACTION_TYPE.CASH_EXPENSE]: EVENT_TYPE_CASH_EXPENSE,
};

// Headers
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
  return fields.map((field) => escapeCsvField(field ?? '')).join(',');
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
    currency: DEFAULT_CURRENCY,
    feeTax: item.tax,
    feeCurrency: DEFAULT_CURRENCY,
    doNotAdjustCash: '',
  };
};

export const handleOrderTransaction = async (
  item: OrderTransaction,
): Promise<CsvRowData[]> => {
  // If exchange is not the default exchange, use the exchange from the item
  const exchange =
    item.exchange !== DEFAULT_EXCHANGE
      ? item.exchange
      : await getExchangeFromIsin(item.isin);

  const rows: CsvRowData[] = [
    {
      event: TYPE_MAP[item.type],
      date: item.date,
      symbol: item.isin,
      exchange,
      note: item.title,
      quantity: item.quantity,
      price: item.price,
      currency: DEFAULT_CURRENCY,
      feeTax: item.fee,
      feeCurrency: DEFAULT_CURRENCY,
      doNotAdjustCash: '',
    },
  ];

  // Create tax transaction if tax exists and is non-zero
  if (item.tax && parseToBigNumber(item.tax).isGreaterThan(0)) {
    rows.push({
      event: EVENT_TYPE_CASH_EXPENSE,
      date: item.date,
      symbol: '',
      exchange: '',
      note: `${item.title} - Tax`,
      quantity: item.tax,
      price: DISABLED_PRICE_FOR_CASH_GAIN_AND_EXPENSES,
      currency: DEFAULT_CURRENCY,
      feeTax: '',
      feeCurrency: '',
      doNotAdjustCash: '',
    });
  }

  // Create tax correction transaction if taxCorrection exists and is non-zero
  if (
    item.taxCorrection &&
    parseToBigNumber(item.taxCorrection).isGreaterThan(0)
  ) {
    rows.push({
      event: EVENT_TYPE_CASH_GAIN,
      date: item.date,
      symbol: '',
      exchange: '',
      note: `${item.title} - Tax Correction`,
      quantity: item.taxCorrection,
      price: DISABLED_PRICE_FOR_CASH_GAIN_AND_EXPENSES,
      currency: DEFAULT_CURRENCY,
      feeTax: '',
      feeCurrency: '',
      doNotAdjustCash: '',
    });
  }

  return rows;
};

export const handleCashTransaction = (item: CashTransaction): CsvRowData => {
  return {
    event: TYPE_MAP[item.type],
    date: item.date,
    symbol: '',
    exchange: '',
    note: item.title,
    quantity: item.amount,
    price: DISABLED_PRICE_FOR_CASH_GAIN_AND_EXPENSES,
    currency: DEFAULT_CURRENCY,
    feeTax: item.tax,
    feeCurrency: DEFAULT_CURRENCY,
    doNotAdjustCash: '',
  };
};

export const handleSplitTransaction = (item: SplitTransaction): CsvRowData => {
  return {
    event: EVENT_TYPE_SPLIT,
    date: item.date,
    symbol: item.isin,
    exchange: '',
    note: item.title,
    quantity: item.creditedShares,
    price: parseToBigNumber(item.creditedShares)
      .dividedBy(parseToBigNumber(item.debitedShares))
      .toFixed(),
    currency: DEFAULT_CURRENCY,
    feeTax: '',
    feeCurrency: '',
    doNotAdjustCash: '',
  };
};

export const convertItemToCsvRow = async (
  item: PortfolioData[0],
): Promise<CsvRowData[] | null> => {
  try {
    // Dividends
    if (item.eventType === TRANSACTION_EVENT_TYPE.DIVIDEND) {
      const row = await handleDividend(item);
      return [row];
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
      item.eventType === TRANSACTION_EVENT_TYPE.TAX_CORRECTION
    ) {
      const row = handleCashTransaction(item);
      return [row];
    }

    // Split
    if (item.eventType === TRANSACTION_EVENT_TYPE.SPLIT) {
      const row = handleSplitTransaction(item);
      return [row];
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
  phoneNumber: string,
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

  // Filter out null results, flatten arrays, and filter empty rows, then convert to CSV format
  const csvRows: string[] = [HEADERS.join(',')];

  for (const rowArray of csvRowResults) {
    if (rowArray) {
      for (const row of rowArray) {
        if (row && !isRowEmpty(row)) {
          const fields = [
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
          csvRows.push(createCsvRow(fields));
        }
      }
    }
  }

  const csvString = csvRows.join('\n');
  saveFile(csvString, FILE_NAME, `${OUTPUT_DIRECTORY}/${phoneNumber}`);
};
