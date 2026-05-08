import { OrderTransaction } from './OrderTransaction';
import { DividendTransaction } from './DividendTransaction';
import { CashTransaction } from './CashTransaction';
import { CorporateActionTransaction } from './CorporateActionTransaction';

export type Portfolio = (
  | OrderTransaction
  | DividendTransaction
  | CashTransaction
  | CorporateActionTransaction
)[];
