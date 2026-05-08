import { TRANSACTION_EVENT_TYPE } from '@/domain/constants';
import { EnrichedTransaction } from '@/domain/models';
import { TRANSACTION_TYPE } from '@/domain/portfolio';

export const identifyBuyOrSell = (
  transaction: EnrichedTransaction,
): TRANSACTION_TYPE.BUY | TRANSACTION_TYPE.SELL => {
  if (
    transaction.subtitle === 'Buy Order' ||
    transaction.subtitle === 'Limit Buy' ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.SAVINGS_PLAN ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.ROUNDUP ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.CASHBACK ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.WELCOME_STOCK_GIFT ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.RECEIVED_GIFT ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.GIVE_AWAY_GIFT
  ) {
    return TRANSACTION_TYPE.BUY;
  }
  // Sell and Limit Sell
  return TRANSACTION_TYPE.SELL;
};
