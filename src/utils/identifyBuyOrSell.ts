import { PortfolioEvent, Transaction } from '../types';

export const identifyBuyOrSell = (transaction: Transaction): PortfolioEvent => {
  if (
    transaction.subtitle === 'Buy Order' ||
    transaction.subtitle === 'Limit Buy' ||
    transaction.subtitle === 'Saving executed' ||
    transaction.subtitle === 'Round up' || // Trade Republic considers this a buy transaction
    transaction.subtitle === 'Saveback' // Trade Republic considers this a buy transaction
  ) {
    return PortfolioEvent.Buy;
  }
  return PortfolioEvent.Sell;
};
