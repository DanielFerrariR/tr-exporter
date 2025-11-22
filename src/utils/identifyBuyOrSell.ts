import { TRANSACTION_EVENT_TYPE } from '../constants';
import { TRANSACTION_TYPE, Transaction } from '../types';

export const identifyBuyOrSell = (
  transaction: Transaction,
): TRANSACTION_TYPE.BUY | TRANSACTION_TYPE.SELL => {
  if (
    transaction.subtitle === 'Buy Order' ||
    transaction.subtitle === 'Limit Buy' ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.SAVINGS_PLAN ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.ROUNDUP ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.CASHBACK ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.STOCK_PERK ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.RECEIVED_GIFT
  ) {
    return TRANSACTION_TYPE.BUY;
  }
  return TRANSACTION_TYPE.SELL;
};
