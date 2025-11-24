import { ACTIVITY_EVENT_TYPE, TRANSACTION_EVENT_TYPE } from '@/constants';
import { Activity, Transaction } from '@/types';

export const identifyActivityEventType = (
  activity: Activity,
): ACTIVITY_EVENT_TYPE | null => {
  // Portfolio-related activities
  // Stock Gift
  if (activity.title === 'Stock Gift' && activity.subtitle === 'Accepted') {
    return ACTIVITY_EVENT_TYPE.RECEIVED_GIFT;
  }

  // Welcome Stock Gift
  if (activity.title === 'Stock Perk' && activity.subtitle === 'Redeemed') {
    return ACTIVITY_EVENT_TYPE.WELCOME_STOCK_GIFT;
  }

  // Give Away Gift
  if (activity.title === 'Give-away' && activity.subtitle === 'Redeemed') {
    return ACTIVITY_EVENT_TYPE.GIVE_AWAY_GIFT;
  }

  // Non-portfolio-related transactions
  // Welcome Stock Gift Expired
  if (activity.title === 'Stock Perk' && activity.subtitle === 'Expired') {
    return ACTIVITY_EVENT_TYPE.WELCOME_STOCK_GIFT_EXPIRED;
  }

  // Cash or Stock (dividend reinvestment options)
  if (activity.subtitle === 'Cash or Stock') {
    return ACTIVITY_EVENT_TYPE.CASH_OR_STOCK;
  }

  // Limit Order Canceled
  if (
    activity.subtitle === 'Limit Buy Canceled' ||
    activity.subtitle === 'Limit Sell Canceled'
  ) {
    return ACTIVITY_EVENT_TYPE.LIMIT_ORDER_CANCELED;
  }

  // Order Rejected
  if (
    activity.subtitle === 'Buy order rejected' ||
    activity.subtitle === 'Sell order rejected'
  ) {
    return ACTIVITY_EVENT_TYPE.ORDER_REJECTED;
  }

  // Security Change
  if (activity.subtitle === 'Change') {
    return ACTIVITY_EVENT_TYPE.SECURITY_CHANGE;
  }

  // Legal Documents
  if (
    activity.title === 'Legal Documents' &&
    activity.subtitle === 'Accepted'
  ) {
    return ACTIVITY_EVENT_TYPE.LEGAL_DOCUMENTS_ACCEPTED;
  }

  if (activity.title === 'Legal documents' && activity.subtitle === 'Added') {
    return ACTIVITY_EVENT_TYPE.LEGAL_DOCUMENTS_ADDED;
  }

  // Account Management
  if (activity.title === 'PIN' && activity.subtitle === 'Changed') {
    return ACTIVITY_EVENT_TYPE.PIN_CHANGED;
  }

  if (activity.title === 'Phone number' && activity.subtitle === 'Changed') {
    return ACTIVITY_EVENT_TYPE.PHONE_NUMBER_CHANGED;
  }

  if (activity.title === 'New IBAN' && activity.subtitle === null) {
    return ACTIVITY_EVENT_TYPE.NEW_IBAN;
  }

  if (
    activity.title === 'Reference account' &&
    activity.subtitle === 'Changed'
  ) {
    return ACTIVITY_EVENT_TYPE.REFERENCE_ACCOUNT_CHANGED;
  }

  if (activity.title === 'Current account' && activity.subtitle === null) {
    return ACTIVITY_EVENT_TYPE.CURRENT_ACCOUNT;
  }

  if (
    activity.title === 'Securities account' &&
    activity.subtitle === 'Opened'
  ) {
    return ACTIVITY_EVENT_TYPE.SECURITIES_ACCOUNT_OPENED;
  }

  // Reports
  if (activity.title === 'Annual Tax Report') {
    return ACTIVITY_EVENT_TYPE.ANNUAL_TAX_REPORT;
  }

  if (activity.title === 'Ex-post cost report' && activity.subtitle === null) {
    return ACTIVITY_EVENT_TYPE.EX_POST_COST_REPORT;
  }

  // Quarterly reports (Q1/2024 Report, Q4/2023 Report, etc.)
  if (/^Q[1-4]\/\d{4} Report$/.test(activity.title)) {
    return ACTIVITY_EVENT_TYPE.QUARTERLY_REPORT;
  }

  // System/Verification
  if (activity.title === 'Email' && activity.subtitle === 'Verified') {
    return ACTIVITY_EVENT_TYPE.EMAIL_VERIFIED;
  }

  if (
    activity.title === 'Identity Verification' &&
    activity.subtitle === 'Successfully verified'
  ) {
    return ACTIVITY_EVENT_TYPE.IDENTITY_VERIFIED;
  }

  if (activity.title === 'New device' && activity.subtitle === 'Paired') {
    return ACTIVITY_EVENT_TYPE.NEW_DEVICE_PAIRED;
  }

  if (
    activity.title === 'PUK sent' &&
    activity.subtitle === 'Arrives in 2 days'
  ) {
    return ACTIVITY_EVENT_TYPE.PUK_SENT;
  }

  // Settings/Compliance
  if (activity.title === 'Exemption order' && activity.subtitle === 'Changed') {
    return ACTIVITY_EVENT_TYPE.EXEMPTION_ORDER_CHANGED;
  }

  if (
    activity.title === 'Exemption order' &&
    activity.subtitle === 'Change requested'
  ) {
    return ACTIVITY_EVENT_TYPE.EXEMPTION_ORDER_CHANGE_REQUESTED;
  }

  if (
    activity.title === 'Suitability assessment' &&
    activity.subtitle === null
  ) {
    return ACTIVITY_EVENT_TYPE.SUITABILITY_ASSESSMENT;
  }

  if (
    activity.title === 'Key Information' &&
    activity.subtitle === 'Received'
  ) {
    return ACTIVITY_EVENT_TYPE.KEY_INFORMATION_RECEIVED;
  }

  return null;
};

export const identifyTransactionEventType = (
  transaction: Transaction,
): TRANSACTION_EVENT_TYPE | null => {
  // Portfolio-related activities
  // Dividends
  if (
    transaction.subtitle === 'Cash dividend' ||
    transaction.subtitle === 'Dividend'
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
    transaction.subtitle === 'Cash dividend corrected' ||
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

// Creating received gift transactions from activities as transactions list doesn't include received gifts
export const getGiftTransactions = (activities: Activity[]): Transaction[] =>
  activities
    .filter(
      (activity) =>
        !!activity.eventType &&
        [
          ACTIVITY_EVENT_TYPE.RECEIVED_GIFT,
          ACTIVITY_EVENT_TYPE.WELCOME_STOCK_GIFT,
          ACTIVITY_EVENT_TYPE.GIVE_AWAY_GIFT,
        ].includes(activity.eventType),
    )
    .map((activity) => ({
      id: activity.id,
      timestamp: activity.timestamp,
      title: activity.title,
      icon: activity.icon,
      badge: null,
      subtitle: activity.subtitle,
      // Only a placeholder value as the value only exists inside the transaction sections field
      // Do not use the amount value for any calculations
      amount: {
        currency: 'EUR',
        value: -1,
        fractionDigits: 2,
      },
      subAmount: null,
      status: 'EXECUTED',
      action: {
        type: 'timelineDetail',
        payload: activity.id,
      },
      eventType: (() => {
        if (activity.eventType === ACTIVITY_EVENT_TYPE.RECEIVED_GIFT) {
          return TRANSACTION_EVENT_TYPE.RECEIVED_GIFT;
        }
        if (activity.eventType === ACTIVITY_EVENT_TYPE.WELCOME_STOCK_GIFT) {
          return TRANSACTION_EVENT_TYPE.WELCOME_STOCK_GIFT;
        }
        // Give away is the default case
        return TRANSACTION_EVENT_TYPE.GIVE_AWAY_GIFT;
      })(),
      cashAccountNumber: null,
      hidden: false,
      deleted: false,
    }));
