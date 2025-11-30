import { ACTIVITY_EVENT_TYPE } from '@/constants';
import { Activity } from '@/types';

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
  if (activity.title === 'Giveaway' && activity.subtitle === 'Redeemed') {
    return ACTIVITY_EVENT_TYPE.GIVE_AWAY_GIFT;
  }

  // Reverse Split
  if (activity.subtitle === 'Reverse Split') {
    return ACTIVITY_EVENT_TYPE.REVERSE_SPLIT;
  }

  // Title Exchange
  if (activity.subtitle === 'Title exchange') {
    return ACTIVITY_EVENT_TYPE.TITLE_EXCHANGE;
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
