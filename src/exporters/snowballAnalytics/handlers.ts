import { TRANSACTION_EVENT_TYPE } from '../../constants';
import {
  TRANSACTION_TYPE,
  CashTransaction,
  DividendTransaction,
  OrderTransaction,
  PortfolioData,
} from '../../types';
import { getExchangeFromIsin } from '../../utils/getExchangeFromIsin';
import {
  DEFAULT_PRICE_FOR_CASH,
  EMPTY_STRING,
  EVENT_TYPE_CASH_EXPENSE,
  EVENT_TYPE_CASH_GAIN,
  EVENT_TYPE_DIVIDEND,
} from './constants';
import { CsvRowData } from './helpers';

export const handleDividend = async (
  item: DividendTransaction,
): Promise<CsvRowData> => {
  const exchange = await getExchangeFromIsin(item.isin);

  return {
    event: EVENT_TYPE_DIVIDEND,
    date: item.date,
    symbol: item.isin,
    exchange,
    note: item.title,
    quantity: item.dividendTotal,
    price: item.dividendPerShare,
    currency: item.currency,
    feeTax: item.feeTax,
    feeCurrency: item.feeCurrency,
    doNotAdjustCash: EMPTY_STRING,
  };
};

export const handleOrderTransaction = async (
  item: OrderTransaction,
): Promise<CsvRowData> => {
  const exchange = await getExchangeFromIsin(item.isin);

  return {
    event: item.type,
    date: item.date,
    symbol: item.isin,
    exchange,
    note: item.title,
    quantity: item.quantity,
    price: item.price,
    currency: item.currency,
    feeTax: item.feeTax,
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
    symbol: EMPTY_STRING, // Cash transactions don't have ISIN
    exchange: EMPTY_STRING, // Cash transactions don't have exchange
    note: item.title,
    quantity: item.amount, // Cash transactions use amount, not quantity
    price: DEFAULT_PRICE_FOR_CASH,
    currency: item.currency,
    feeTax: item.feeTax,
    feeCurrency: item.feeCurrency,
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
      item.eventType === TRANSACTION_EVENT_TYPE.GIVE_AWAY
    ) {
      return await handleOrderTransaction(item);
    }

    // Cash Gain and Cash Expense
    if (
      item.eventType === TRANSACTION_EVENT_TYPE.INTEREST ||
      item.eventType === TRANSACTION_EVENT_TYPE.TAX_CORRECTION
    ) {
      return handleCashTransaction(item);
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
