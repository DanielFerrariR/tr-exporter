import { OrderTransaction } from './transactions/OrderTransaction';
import { DividendTransaction } from './transactions/DividendTransaction';
import { CashTransaction } from './transactions/CashTransaction';
import { CorporateActionTransaction } from './transactions/CorporateActionTransaction';
import { IsinChangeTransaction } from './transactions/IsinChangeTransaction';

export type Portfolio = (
  | OrderTransaction
  | DividendTransaction
  | CashTransaction
  | CorporateActionTransaction
  | IsinChangeTransaction
)[];
