import { ACTIVITY_EVENT_TYPE, TRANSACTION_EVENT_TYPE } from '../constants';
import { Activity, Transaction } from '../types';

export const identifyTransactionEventType = (
  transaction: Transaction,
): TRANSACTION_EVENT_TYPE | null => {
  // Dividends
  if (transaction.subtitle === 'Cash dividend') {
    return TRANSACTION_EVENT_TYPE.DIVIDEND;
  }

  // Buy, Sell, Limit Buy, Limit Sell Orders
  if (
    transaction.subtitle === 'Buy Order' ||
    transaction.subtitle === 'Sell Order' ||
    transaction.subtitle === 'Limit Buy' ||
    transaction.subtitle === 'Limit Sell'
  ) {
    return TRANSACTION_EVENT_TYPE.TRADE;
  }

  // Savings plans
  if (transaction.subtitle === 'Saving executed') {
    return TRANSACTION_EVENT_TYPE.SAVINGS_PLAN;
  }

  // Round ups
  if (transaction.subtitle === 'Round up') {
    return TRANSACTION_EVENT_TYPE.ROUNDUP;
  }

  // Saveback (15 euros per month bonus)
  if (transaction.subtitle === 'Saveback') {
    return TRANSACTION_EVENT_TYPE.CASHBACK;
  }

  // Interest
  if (transaction.title === 'Interest') {
    return TRANSACTION_EVENT_TYPE.INTEREST;
  }

  // Tax corrections
  if (transaction.subtitle === 'Cash dividend corrected') {
    return TRANSACTION_EVENT_TYPE.TAX_CORRECTION;
  }

  return null;
};
