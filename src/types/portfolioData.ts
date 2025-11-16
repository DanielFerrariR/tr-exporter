export enum PortfolioEventType {
  Buy = 'Buy',
  Sell = 'Sell',
  Dividend = 'Dividend',
  CashGain = 'Cash Gain',
  CashExpense = 'Cash Expense',
}

// Buy and Sell
interface OrderTransaction {
  title: string;
  eventType: PortfolioEventType.Buy | PortfolioEventType.Sell;
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
  eventType: PortfolioEventType.Dividend;
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

// Cash Gain and Cash Expense
interface CashTransaction {
  title: string;
  eventType: PortfolioEventType.CashGain | PortfolioEventType.CashExpense;
  date: string;
  amount: string;
  currency: string;
  feeTax: string;
  feeCurrency: string;
}

// Not real Trade Republic types, just used for our internal purposes
// Used to simplify the data needed to build a portfolio CSV
export type PortfolioData = (
  | OrderTransaction
  | DividendTransaction
  | CashTransaction
)[];
