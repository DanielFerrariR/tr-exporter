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
  REVERSE_SPLIT = 'Reverse Split', // Reverse split
  TITLE_EXCHANGE = 'Title Exchange', // Title exchange

  // Non-portfolio-related transactions
  // Legal Documents
  LEGAL_DOCUMENTS_ACCEPTED = 'Legal Documents Accepted', // Legal documents accepted
  LEGAL_DOCUMENTS_ADDED = 'Legal Documents Added', // Legal documents added

  // Account Management
  PIN_CHANGED = 'PIN Changed', // PIN changed
  PHONE_NUMBER_CHANGED = 'Phone Number Changed', // Phone number changed
  NEW_IBAN = 'New IBAN', // New IBAN added
  REFERENCE_ACCOUNT_CHANGED = 'Reference Account Changed', // Reference account changed
  CURRENT_ACCOUNT = 'Current Account', // Current account information
  SECURITIES_ACCOUNT_OPENED = 'Securities Account Opened', // Securities account opened

  // Reports
  ANNUAL_TAX_REPORT = 'Annual Tax Report', // Annual tax report
  EX_POST_COST_REPORT = 'Ex-post Cost Report', // Ex-post cost report
  QUARTERLY_REPORT = 'Quarterly Report', // Quarterly report (Q1, Q2, Q3, Q4)

  // System/Verification
  EMAIL_VERIFIED = 'Email Verified', // Email address verified
  IDENTITY_VERIFIED = 'Identity Verified', // Identity verification completed
  NEW_DEVICE_PAIRED = 'New Device Paired', // New device paired
  PUK_SENT = 'PUK Sent', // PUK code sent

  // Settings/Compliance
  EXEMPTION_ORDER_CHANGED = 'Exemption Order Changed', // Exemption order changed
  EXEMPTION_ORDER_CHANGE_REQUESTED = 'Exemption Order Change Requested', // Exemption order change requested
  SUITABILITY_ASSESSMENT = 'Suitability Assessment', // Suitability assessment
  KEY_INFORMATION_RECEIVED = 'Key Information Received', // Key information document received
}
