import { ORDER_TYPE, Transaction } from '../types';

export const identifyBuyOrSell = (
  transaction: Transaction,
): ORDER_TYPE.BUY | ORDER_TYPE.SELL => {
  if (
    transaction.subtitle === 'Buy Order' ||
    transaction.subtitle === 'Limit Buy' ||
    transaction.subtitle === 'Saving executed' ||
    transaction.subtitle === 'Round up' || // Trade Republic considers this a buy transaction
    transaction.subtitle === 'Saveback' // Trade Republic considers this a buy transaction
  ) {
    return ORDER_TYPE.BUY;
  }
  return ORDER_TYPE.SELL;
};
