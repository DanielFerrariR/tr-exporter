export enum PortfolioEventType {
  Buy = 'Buy',
  LimitBuy = 'Limit Buy',
  Sell = 'Sell',
  LimitSell = 'Limit Sell',
  Dividend = 'Dividend',
  CashGain = 'Cash Gain',
  CashExpense = 'Cash Expense',
}

// Buy, Limit Buy, Sell, Limit Sell
interface OrderTransaction {
  title: string;
  eventType:
    | PortfolioEventType.Buy
    | PortfolioEventType.LimitBuy
    | PortfolioEventType.Sell
    | PortfolioEventType.LimitSell;
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

// Cash Gain, Cash Expense
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
// Used to simplify the data needed to build portfolio CSV export
export type PortfolioData = (
  | OrderTransaction
  | DividendTransaction
  | CashTransaction
)[];
