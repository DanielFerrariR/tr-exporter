import { TRANSACTION_EVENT_TYPE } from '@/constants';
import { Transaction } from '@/types';

export const identifyTransactionEventType = (
  transaction: Transaction,
): TRANSACTION_EVENT_TYPE | null => {
  // Portfolio-related activities
  // Dividends
  if (
    transaction.subtitle === 'Cash dividend' ||
    transaction.subtitle === 'Dividend' ||
    transaction.subtitle === 'Cash dividend corrected'
  ) {
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
  if (
    (transaction.title === 'Tax correction' && transaction.subtitle === null) ||
    transaction.subtitle === 'Pre-Determined Tax Base' ||
    (transaction.title === 'Tax Settlement' &&
      transaction.subtitle === 'Tax booking')
  ) {
    return TRANSACTION_EVENT_TYPE.TAX_CORRECTION;
  }

  // Sent Stock Gift (Received gifts aren't included in transactions list)
  if (
    transaction.title === 'Stock Gift' &&
    transaction.subtitle === 'Accepted'
  ) {
    return TRANSACTION_EVENT_TYPE.SENT_GIFT;
  }

  // Welcome Stock Gift
  if (
    transaction.title === 'Stock Perk' &&
    transaction.subtitle === 'Redeemed'
  ) {
    return TRANSACTION_EVENT_TYPE.WELCOME_STOCK_GIFT;
  }

  // Give Away Gift
  if (
    transaction.title === 'Give-away' &&
    transaction.subtitle === 'Redeemed'
  ) {
    return TRANSACTION_EVENT_TYPE.GIVE_AWAY_GIFT;
  }

  // Non-portfolio-related transactions
  if (transaction.subtitle?.includes('Saving executed ·')) {
    return TRANSACTION_EVENT_TYPE.SAVINGS_PLAN_FOR_CHILDREN;
  }

  // Transfers: subtitle is "Completed" or "Sent"
  if (transaction.subtitle === 'Completed' || transaction.subtitle === 'Sent') {
    return TRANSACTION_EVENT_TYPE.TRANSFER;
  }

  // Status indicators: subtitle is "Declined", "Cancelled", or "Card verification"
  if (
    transaction.subtitle === 'Declined' ||
    transaction.subtitle === 'Cancelled' ||
    transaction.subtitle === 'Card verification'
  ) {
    return TRANSACTION_EVENT_TYPE.STATUS_INDICATOR;
  }

  // Card payments: subtitle is null AND title is not a portfolio-related title
  // Portfolio-related titles with null subtitle: "Interest", "Tax correction"
  if (transaction.subtitle === null) {
    const portfolioTitlesWithNullSubtitle = ['Interest', 'Tax correction'];
    if (!portfolioTitlesWithNullSubtitle.includes(transaction.title)) {
      return TRANSACTION_EVENT_TYPE.CARD_PAYMENT;
    }
  }

  return null;
};
