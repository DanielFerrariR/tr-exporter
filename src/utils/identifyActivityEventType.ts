import { ACTIVITY_EVENT_TYPE } from '@/constants';
import { Activity } from '@/types';

export const identifyActivityEventType = (
  activity: Activity,
): ACTIVITY_EVENT_TYPE | null => {
  // Portfolio-related activities
  // Received stock gifts from a friend
  if (activity.title === 'Stock Gift' && activity.subtitle === 'Accepted') {
    return ACTIVITY_EVENT_TYPE.RECEIVED_GIFT;
  }

  // Welcome stock gifts when opening an account  (They use the stock title)
  if (activity.title !== 'Giveaway' && activity.subtitle === 'Redeemed') {
    return ACTIVITY_EVENT_TYPE.WELCOME_STOCK_GIFT;
  }

  // Give away stock gifts from Trade Republic
  if (activity.title === 'Giveaway' && activity.subtitle === 'Redeemed') {
    return ACTIVITY_EVENT_TYPE.GIVE_AWAY_GIFT;
  }

  // Stock splits or reverse splits that change the number of shares held
  if (
    activity.subtitle === 'Stock split' ||
    activity.subtitle === 'Corporate action' // Corporate action is a generic old name for stock splits
  ) {
    return ACTIVITY_EVENT_TYPE.STOCK_SPLIT;
  }

  // Non-portfolio-related transactions
  // General corporate actions like meetings, notices, or instructions
  if (
    activity.subtitle === 'Preliminary Lump Sum' ||
    activity.subtitle === 'Stock Dividend Instruction' ||
    activity.subtitle === 'General Meeting' ||
    activity.subtitle === 'Annual general meeting' ||
    activity.subtitle === 'Company Notice'
  ) {
    return ACTIVITY_EVENT_TYPE.CORPORATE_ACTION;
  }

  // Welcome stock gifts that were not redeemed in time
  if (activity.subtitle === 'Expired') {
    return ACTIVITY_EVENT_TYPE.WELCOME_STOCK_GIFT_EXPIRED;
  }

  // Selection between receiving cash dividends or stock dividends
  if (activity.subtitle === 'Cash or Stock') {
    return ACTIVITY_EVENT_TYPE.CASH_OR_STOCK;
  }

  // Buy or Sell limit orders that were canceled or expired
  if (
    activity.subtitle?.toLowerCase().includes('limit') &&
    (activity.subtitle?.toLowerCase().includes('canceled') ||
      activity.subtitle?.toLowerCase().includes('expired'))
  ) {
    return ACTIVITY_EVENT_TYPE.LIMIT_ORDER_CANCELED;
  }

  // Orders that were rejected by the system
  if (activity.subtitle?.toLowerCase().includes('order rejected')) {
    return ACTIVITY_EVENT_TYPE.ORDER_REJECTED;
  }

  // Updates to securities, such as name changes or bankruptcies
  if (activity.subtitle === 'Change' || activity.subtitle === 'Bankruptcy') {
    return ACTIVITY_EVENT_TYPE.SECURITY_CHANGE;
  }

  // Non-portfolio-related transactions
  // Updates to the residential address
  if (
    activity.title === 'Address' &&
    (activity.subtitle === 'Changed' ||
      activity.subtitle === 'Change requested')
  ) {
    return ACTIVITY_EVENT_TYPE.ADDRESS_CHANGED;
  }

  // Updates or changes to the internal cash account
  if (activity.title === 'Cash account' && activity.subtitle === 'Changed') {
    return ACTIVITY_EVENT_TYPE.CASH_ACCOUNT_CHANGED;
  }

  // Changes or updates to the user's citizenship status
  if (
    activity.title === 'Citizenship update' &&
    activity.subtitle === 'Updated'
  ) {
    return ACTIVITY_EVENT_TYPE.CITIZENSHIP_UPDATE;
  }

  // Confirmation of email address verification
  if (activity.title === 'Email' && activity.subtitle === 'Verified') {
    return ACTIVITY_EVENT_TYPE.EMAIL_VERIFIED;
  }

  // Updates to the tax exemption order (Freistellungsauftrag)
  if (
    activity.title === 'Exemption order' &&
    (activity.subtitle === 'Changed' ||
      activity.subtitle === 'Change requested')
  ) {
    return ACTIVITY_EVENT_TYPE.EXEMPTION_ORDER_CHANGED;
  }

  // Successful verification of user identity
  if (
    activity.title === 'Identity Verification' &&
    activity.subtitle === 'Successfully verified'
  ) {
    return ACTIVITY_EVENT_TYPE.IDENTITY_VERIFICATION;
  }

  // Acceptance or addition of legal agreements and documents
  if (
    (activity.title === 'Legal Documents' ||
      activity.title === 'Legal documents') &&
    (activity.subtitle === 'Accepted' ||
      activity.subtitle === 'Added' ||
      activity.subtitle === 'Changed')
  ) {
    return ACTIVITY_EVENT_TYPE.LEGAL_DOCUMENTS;
  }

  // Pairing or identification of a new mobile device
  if (activity.title === 'New device') {
    return ACTIVITY_EVENT_TYPE.NEW_DEVICE;
  }

  // Confirmation of personal user details
  if (
    activity.title === 'Personal details' &&
    activity.subtitle === 'Confirmed'
  ) {
    return ACTIVITY_EVENT_TYPE.PERSONAL_DETAILS_CONFIRMED;
  }

  // Updates to the registered phone number
  if (activity.title === 'Phone number' && activity.subtitle === 'Changed') {
    return ACTIVITY_EVENT_TYPE.PHONE_NUMBER_CHANGED;
  }

  // Updates to the security PIN for the account
  if (activity.title === 'PIN' && activity.subtitle === 'Changed') {
    return ACTIVITY_EVENT_TYPE.PIN_CHANGED;
  }

  // Submission of proof of wealth documents
  if (activity.title === 'Proof of Wealth' && activity.subtitle === 'Added') {
    return ACTIVITY_EVENT_TYPE.PROOF_OF_WEALTH_ADDED;
  }

  // Changes to the linked external bank account
  if (
    activity.title === 'Reference account' &&
    activity.subtitle === 'Changed'
  ) {
    return ACTIVITY_EVENT_TYPE.REFERENCE_ACCOUNT_CHANGED;
  }

  // Successful opening of the securities trading account
  if (
    activity.title === 'Securities account' &&
    activity.subtitle === 'Opened'
  ) {
    return ACTIVITY_EVENT_TYPE.SECURITIES_ACCOUNT_OPENED;
  }

  // Availability of the annual tax report
  if (activity.title === 'Annual Tax Report') {
    return ACTIVITY_EVENT_TYPE.ANNUAL_TAX_REPORT;
  }

  // Availability of the annual crypto statement
  if (activity.title === 'Crypto Annual Statement') {
    return ACTIVITY_EVENT_TYPE.CRYPTO_ANNUAL_STATEMENT;
  }

  // Annual report detailing all costs incurred
  if (activity.title === 'Ex-post cost report') {
    return ACTIVITY_EVENT_TYPE.EX_POST_COST_REPORT;
  }

  // Availability of the quarterly account statement
  if (activity.title === 'Quarterly report') {
    return ACTIVITY_EVENT_TYPE.QUARTERLY_REPORT;
  }

  // Receipt of key investor information documents
  if (
    activity.title === 'Key Information' &&
    activity.subtitle === 'Received'
  ) {
    return ACTIVITY_EVENT_TYPE.KEY_INFORMATION_RECEIVED;
  }

  // Completion of the investment suitability test
  if (activity.title === 'Suitability assessment') {
    return ACTIVITY_EVENT_TYPE.SUITABILITY_ASSESSMENT;
  }

  // Assignment of a new IBAN for the cash account
  if (activity.title === 'New IBAN') {
    return ACTIVITY_EVENT_TYPE.NEW_IBAN;
  }

  // Generic current account related updates
  if (activity.title === 'Current account') {
    return ACTIVITY_EVENT_TYPE.CURRENT_ACCOUNT;
  }

  // Dispatch of the Personal Unblocking Key
  if (activity.title === 'PUK sent') {
    return ACTIVITY_EVENT_TYPE.PUK_SENT;
  }

  // Information provided for opening secondary accounts (e.g., for children)
  if (
    activity.title.startsWith('Open ') &&
    activity.title.endsWith(' account')
  ) {
    return ACTIVITY_EVENT_TYPE.OPEN_ACCOUNT_PROVIDED;
  }

  console.warn(
    `Could not identify activity event type for ID: ${activity.id}`,
    {
      title: activity.title,
      subtitle: activity.subtitle,
    },
  );
  return null;
};
