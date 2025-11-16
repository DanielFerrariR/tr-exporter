import { TRANSACTION_TYPE, Transaction } from '../types';

export const identifyBuyOrSell = (
  transaction: Transaction,
): TRANSACTION_TYPE.BUY | TRANSACTION_TYPE.SELL => {
  if (
    transaction.subtitle === 'Buy Order' ||
    transaction.subtitle === 'Limit Buy' ||
    transaction.subtitle === 'Saving executed' ||
    transaction.subtitle === 'Round up' || // Trade Republic considers this a buy transaction
    transaction.subtitle === 'Saveback' // Trade Republic considers this a buy transaction
  ) {
    return TRANSACTION_TYPE.BUY;
  }
  return TRANSACTION_TYPE.SELL;
};
