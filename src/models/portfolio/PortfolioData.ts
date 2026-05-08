import { OrderTransaction } from './OrderTransaction';
import { DividendTransaction } from './DividendTransaction';
import { CashTransaction } from './CashTransaction';
import { CorporateActionTransaction } from './CorporateActionTransaction';

export type PortfolioData = (
  | OrderTransaction
  | DividendTransaction
  | CashTransaction
  | CorporateActionTransaction
)[];
