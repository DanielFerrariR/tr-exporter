import { TRANSACTION_EVENT_TYPE } from '../constants';

export enum ORDER_TYPE {
  BUY = 'Buy',
  SELL = 'Sell',
  CASH_GAIN = 'Cash Gain',
  CASH_LOSS = 'Cash Loss',
}

// Buy and Sell
interface TradeTransaction {
  title: string;
  eventType:
    | TRANSACTION_EVENT_TYPE.TRADE
    | TRANSACTION_EVENT_TYPE.SAVINGS_PLAN
    | TRANSACTION_EVENT_TYPE.ROUNDUP
    | TRANSACTION_EVENT_TYPE.CASHBACK
    | TRANSACTION_EVENT_TYPE.STOCK_PERK
    | TRANSACTION_EVENT_TYPE.GIFT;
  orderType: ORDER_TYPE.BUY | ORDER_TYPE.SELL;
  date: string;
  isin: string;
  price: string;
  quantity: string;
  currency: string;
  feeTax: string;
  feeCurrency: string;
  exchange: string;
}

// Dividend
interface DividendTransaction {
  title: string;
  eventType: TRANSACTION_EVENT_TYPE.DIVIDEND;
  date: string;
  isin: string;
  currency: string;
  feeTax: string;
  feeCurrency: string;
  exchange: string;
  shares: string;
  dividendPerShare: string;
  dividendTotal: string;
}

// Cash Gain and Cash Loss
interface CashTransaction {
  title: string;
  eventType:
    | TRANSACTION_EVENT_TYPE.INTEREST
    | TRANSACTION_EVENT_TYPE.TAX_CORRECTION;
  orderType: ORDER_TYPE.CASH_GAIN | ORDER_TYPE.CASH_LOSS;
  date: string;
  amount: string;
  currency: string;
  feeTax: string;
  feeCurrency: string;
}

// Not real Trade Republic types, just used for our internal purposes
// Used to simplify the data needed to build a portfolio CSV
export type PortfolioData = (
  | TradeTransaction
  | DividendTransaction
  | CashTransaction
)[];
