import { TRANSACTION_EVENT_TYPE } from '@/constants';

export enum TRANSACTION_TYPE {
  BUY = 'Buy',
  SELL = 'Sell',
  CASH_GAIN = 'Cash Gain',
  CASH_EXPENSE = 'Cash Expense',
}

// Buy and Sell
export interface OrderTransaction {
  title: string;
  eventType:
    | TRANSACTION_EVENT_TYPE.TRADE
    | TRANSACTION_EVENT_TYPE.SAVINGS_PLAN
    | TRANSACTION_EVENT_TYPE.ROUNDUP
    | TRANSACTION_EVENT_TYPE.CASHBACK
    | TRANSACTION_EVENT_TYPE.WELCOME_STOCK_GIFT
    | TRANSACTION_EVENT_TYPE.RECEIVED_GIFT
    | TRANSACTION_EVENT_TYPE.GIVE_AWAY_GIFT;
  type: TRANSACTION_TYPE.BUY | TRANSACTION_TYPE.SELL;
  date: string;
  isin: string;
  price: string;
  quantity: string;
  currency: string;
  fee: string;
  feeCurrency: string;
  exchange: string;
}

// Dividend
export interface DividendTransaction {
  title: string;
  eventType: TRANSACTION_EVENT_TYPE.DIVIDEND;
  date: string;
  isin: string;
  currency: string;
  tax: string;
  taxCurrency: string;
  exchange: string;
  shares: string;
  dividendPerShare: string;
  dividendTotal: string;
}

// Cash Gain and Cash Loss
export interface CashTransaction {
  title: string;
  eventType:
    | TRANSACTION_EVENT_TYPE.INTEREST
    | TRANSACTION_EVENT_TYPE.TAX
    | TRANSACTION_EVENT_TYPE.TAX_CORRECTION;
  type: TRANSACTION_TYPE.CASH_GAIN | TRANSACTION_TYPE.CASH_EXPENSE;
  date: string;
  amount: string;
  currency: string;
  tax: string;
  taxCurrency: string;
}

export interface SplitTransaction {
  title: string;
  eventType: TRANSACTION_EVENT_TYPE.SPLIT;
  date: string;
  isin: string;
  creditedShares: string;
  debitedShares: string;
}

// Not real Trade Republic types, just used for our internal purposes
// Used to simplify the data needed to build a portfolio CSV
export type PortfolioData = (
  | OrderTransaction
  | DividendTransaction
  | CashTransaction
  | SplitTransaction
)[];
