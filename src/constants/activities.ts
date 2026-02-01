export enum ACTIVITY_EVENT_TYPE {
  // Portfolio-related activities
  RECEIVED_GIFT = 'Received Gift', // Received stock gifts from a friend
  WELCOME_STOCK_GIFT = 'Welcome Stock Gift', // Welcome stock gifts when opening an account
  GIVE_AWAY_GIFT = 'Give Away Gift', // Give away stock gifts from Trade Republic
  WELCOME_STOCK_GIFT_EXPIRED = 'Welcome Stock Gift Expired', // Expired Welcome stock gifts
  CASH_OR_STOCK = 'Cash or Stock', // Dividend reinvestment options
  LIMIT_ORDER_CANCELED = 'Limit Order Canceled', // Cancelled limit buy/sell orders
  ORDER_REJECTED = 'Order Rejected', // Rejected buy/sell orders
  SECURITY_CHANGE = 'Security Change', // Changes to securities (e.g., ETF changes)
  STOCK_SPLIT = 'Stock Split', // Stock splits or reverse splits
  CORPORATE_ACTION = 'Corporate Action', // General corporate actions

  // Non-portfolio-related transactions
  ADDRESS_CHANGED = 'Address Changed', // Updates to the residential address
  CASH_ACCOUNT_CHANGED = 'Cash Account Changed', // Updates or changes to the internal cash account
  CITIZENSHIP_UPDATE = 'Citizenship Update', // Changes or updates to the user's citizenship status
  EMAIL_VERIFIED = 'Email Verified', // Confirmation of email address verification
  EXEMPTION_ORDER_CHANGED = 'Exemption Order Changed', // Updates to the tax exemption order (Freistellungsauftrag)
  IDENTITY_VERIFICATION = 'Identity Verification', // Successful verification of user identity
  LEGAL_DOCUMENTS = 'Legal Documents', // Acceptance or addition of legal agreements and documents
  NEW_DEVICE = 'New Device', // Pairing or identification of a new mobile device
  PERSONAL_DETAILS_CONFIRMED = 'Personal Details Confirmed', // Confirmation of personal user details
  PHONE_NUMBER_CHANGED = 'Phone Number Changed', // Updates to the registered phone number
  PIN_CHANGED = 'PIN Changed', // Updates to the security PIN for the account
  PROOF_OF_WEALTH_ADDED = 'Proof of Wealth Added', // Submission of proof of wealth documents
  REFERENCE_ACCOUNT_CHANGED = 'Reference Account Changed', // Changes to the linked external bank account
  SECURITIES_ACCOUNT_OPENED = 'Securities Account Opened', // Successful opening of the securities trading account
  ANNUAL_TAX_REPORT = 'Annual Tax Report', // Availability of the annual tax report
  CRYPTO_ANNUAL_STATEMENT = 'Crypto Annual Statement', // Availability of the annual crypto statement
  EX_POST_COST_REPORT = 'Ex-post Cost Report', // Annual report detailing all costs incurred
  QUARTERLY_REPORT = 'Quarterly Report', // Availability of the quarterly account statement
  KEY_INFORMATION_RECEIVED = 'Key Information Received', // Receipt of key investor information documents
  SUITABILITY_ASSESSMENT = 'Suitability Assessment', // Completion of the investment suitability test
  NEW_IBAN = 'New IBAN', // Assignment of a new IBAN for the cash account
  CURRENT_ACCOUNT = 'Current Account', // Generic current account related updates
  PUK_SENT = 'PUK Sent', // Dispatch of the Personal Unblocking Key
  OPEN_ACCOUNT_PROVIDED = 'Open Account Provided', // Information provided for opening secondary accounts
}
