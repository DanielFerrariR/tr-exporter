import { ACTIVITY_EVENT_TYPE } from '@/constants';
import { Activity } from '@/types';

export const identifyActivityEventType = (
  activity: Activity,
): ACTIVITY_EVENT_TYPE | null => {
  const trActivityType = activity.eventType as string | null;

  // Portfolio-related activities
  // Received stock gifts from a friend
  if (trActivityType === 'GIFTING_RECIPIENT_ACTIVITY') {
    return ACTIVITY_EVENT_TYPE.RECEIVED_GIFT;
  }

  if (trActivityType === 'STOCK_PERK_REFUNDED') {
    return ACTIVITY_EVENT_TYPE.WELCOME_STOCK_GIFT;
  }

  // Give away stock gifts from Trade Republic
  if (trActivityType === 'GIFTING_LOTTERY_PRIZE_ACTIVITY') {
    return ACTIVITY_EVENT_TYPE.GIVE_AWAY_GIFT;
  }

  // Corporate actions that change the number of shares held (using subtitle if eventType is too generic)
  if (
    activity.subtitle === 'Stock split' ||
    trActivityType === 'SHAREBOOKING'
  ) {
    return ACTIVITY_EVENT_TYPE.CORPORATE_ACTION;
  }

  // Non-portfolio-related transactions
  // General corporate actions like meetings, notices, or instructions (using subtitle if eventType is too generic)
  if (
    activity.subtitle === 'Preliminary Lump Sum' ||
    trActivityType === 'INSTRUCTION_CORPORATE_ACTION' ||
    trActivityType === 'GENERAL_MEETING' ||
    activity.subtitle === 'Annual general meeting' ||
    trActivityType === 'GESH_CORPORATE_ACTION'
  ) {
    return ACTIVITY_EVENT_TYPE.CORPORATE_NOTIFICATION;
  }

  // Welcome stock gifts that were not redeemed in time
  if (trActivityType === 'STOCK_PERK_EXPIRED') {
    return ACTIVITY_EVENT_TYPE.WELCOME_STOCK_GIFT_EXPIRED;
  }

  // Selection between receiving cash dividends or stock dividends (tr event type is too generic)
  if (activity.subtitle === 'Cash or Stock') {
    return ACTIVITY_EVENT_TYPE.CASH_OR_STOCK;
  }

  // Buy or Sell limit orders that were canceled or expired
  if (
    trActivityType === 'ORDER_CANCELED' ||
    trActivityType === 'TRADING_ORDER_CANCELLED'
  ) {
    return ACTIVITY_EVENT_TYPE.LIMIT_ORDER_CANCELED;
  }

  if (trActivityType === 'ORDER_EXPIRED') {
    return ACTIVITY_EVENT_TYPE.LIMIT_ORDER_EXPIRED;
  }

  // Orders that were rejected by the system
  if (trActivityType === 'TRADING_ORDER_REJECTED') {
    return ACTIVITY_EVENT_TYPE.ORDER_REJECTED;
  }

  // Updates to securities, such as name changes or bankruptcies (TR event type is too generic)
  if (activity.subtitle === 'Change' || activity.subtitle === 'Bankruptcy') {
    return ACTIVITY_EVENT_TYPE.SECURITY_CHANGE;
  }

  // Non-portfolio-related transactions
  // Updates to the residential address
  if (trActivityType === 'ADDRESS_CHANGED') {
    return ACTIVITY_EVENT_TYPE.ADDRESS_CHANGED;
  }

  // Updates or changes to the internal cash account
  if (trActivityType === 'CASH_ACCOUNT_CHANGED') {
    return ACTIVITY_EVENT_TYPE.CASH_ACCOUNT_CHANGED;
  }

  // Changes or updates to the user's citizenship status (TR event type is null)
  if (
    activity.title === 'Citizenship update' &&
    activity.subtitle === 'Updated'
  ) {
    return ACTIVITY_EVENT_TYPE.CITIZENSHIP_UPDATE;
  }

  // Confirmation of email address verification
  if (trActivityType === 'EMAIL_VALIDATED') {
    return ACTIVITY_EVENT_TYPE.EMAIL_VERIFIED;
  }

  // Change to the tax exemption order (Freistellungsauftrag)
  if (trActivityType === 'EXEMPTION_ORDER_CHANGED') {
    return ACTIVITY_EVENT_TYPE.EXEMPTION_ORDER_CHANGED;
  }

  // Request changes to the tax exemption order (Freistellungsauftrag)
  if (trActivityType === 'EXEMPTION_ORDER_CHANGE_REQUESTED') {
    return ACTIVITY_EVENT_TYPE.EXEMPTION_ORDER_CHANGE_REQUESTED;
  }

  // Successful verification of user identity
  if (trActivityType === 'VERIFICATION_TRANSFER_ACCEPTED') {
    return ACTIVITY_EVENT_TYPE.IDENTITY_VERIFICATION;
  }

  // Acceptance or addition of legal agreements and documents
  if (
    trActivityType === 'DOCUMENTS_ACCEPTED' ||
    trActivityType === 'DOCUMENTS_CHANGED' ||
    trActivityType === 'DOCUMENTS_CREATED' ||
    trActivityType?.includes('CRYPTO_TNC_UPDATE_') // CRYPTO_TNC_UPDATE_2025, CRYPTO_TNC_UPDATE_2026, etc.
  ) {
    return ACTIVITY_EVENT_TYPE.LEGAL_DOCUMENTS;
  }

  // Pairing or identification of a new mobile device
  if (trActivityType === 'DEVICE_RESET') {
    return ACTIVITY_EVENT_TYPE.NEW_DEVICE;
  }

  // Confirmation of personal user details (TR event type is null)
  if (
    activity.title === 'Personal details' &&
    activity.subtitle === 'Confirmed'
  ) {
    return ACTIVITY_EVENT_TYPE.PERSONAL_DETAILS_CONFIRMED;
  }

  // Updates to the registered phone number
  if (trActivityType === 'MOBILE_CHANGED') {
    return ACTIVITY_EVENT_TYPE.PHONE_NUMBER_CHANGED;
  }

  // Updates to the security PIN for the account
  if (trActivityType === 'PIN_CHANGED') {
    return ACTIVITY_EVENT_TYPE.PIN_CHANGED;
  }

  // Submission of proof of wealth documents
  if (trActivityType === 'AML_SOURCE_OF_WEALTH_RESPONSE_EXECUTED') {
    return ACTIVITY_EVENT_TYPE.PROOF_OF_WEALTH_ADDED;
  }

  // Changes to the linked external bank account
  if (trActivityType === 'REFERENCE_ACCOUNT_CHANGED') {
    return ACTIVITY_EVENT_TYPE.REFERENCE_ACCOUNT_CHANGED;
  }

  // Successful opening of the securities trading account
  if (trActivityType === 'SECURITIES_ACCOUNT_CREATED') {
    return ACTIVITY_EVENT_TYPE.SECURITIES_ACCOUNT_OPENED;
  }

  // Availability of the annual tax report
  if (
    trActivityType === 'TAX_YEAR_END_REPORT_CREATED' ||
    trActivityType === 'YEAR_END_TAX_REPORT'
  ) {
    return ACTIVITY_EVENT_TYPE.ANNUAL_TAX_REPORT;
  }

  // Availability of the annual crypto statement
  if (activity.title === 'Crypto Annual Statement') {
    return ACTIVITY_EVENT_TYPE.CRYPTO_ANNUAL_STATEMENT;
  }

  // Annual report detailing all costs incurred
  if (trActivityType === 'EX_POST_COST_REPORT_CREATED') {
    return ACTIVITY_EVENT_TYPE.EX_POST_COST_REPORT;
  }

  // Availability of the quarterly account statement
  if (trActivityType === 'QUARTERLY_REPORT') {
    return ACTIVITY_EVENT_TYPE.QUARTERLY_REPORT;
  }

  // Receipt of key investor information documents
  if (trActivityType === 'CUSTOMER_CREATED') {
    return ACTIVITY_EVENT_TYPE.KEY_INFORMATION_RECEIVED;
  }

  // Completion of the investment suitability test
  if (trActivityType === 'PRIVATE_MARKETS_SUITABILITY_QUIZ_COMPLETED') {
    return ACTIVITY_EVENT_TYPE.SUITABILITY_ASSESSMENT;
  }

  // Assignment of a new IBAN for the cash account (TR event type is null)
  if (activity.title === 'New IBAN') {
    return ACTIVITY_EVENT_TYPE.NEW_IBAN;
  }

  // Generic current account related updates (TR event type is null)
  if (activity.title === 'Current account') {
    return ACTIVITY_EVENT_TYPE.CURRENT_ACCOUNT;
  }

  // Dispatch of the Personal Unblocking Key
  if (trActivityType === 'PUK_CREATED') {
    return ACTIVITY_EVENT_TYPE.PUK_SENT;
  }

  // Information provided for opening secondary accounts (e.g., for children) (TR event type is null)
  if (
    activity.title.startsWith('Open ') &&
    activity.title.endsWith(' account')
  ) {
    return ACTIVITY_EVENT_TYPE.OPEN_ACCOUNT_PROVIDED;
  }

  throw Error(
    `Could not identify activity event type: ${JSON.stringify(activity)}`,
  );
};
