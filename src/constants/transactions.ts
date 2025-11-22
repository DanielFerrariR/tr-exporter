export enum TRANSACTION_EVENT_TYPE {
  // Portfolio-related transactions
  SAVINGS_PLAN = 'Saving Plan', // savings plan
  ROUNDUP = 'Roundup', // roundup
  CASHBACK = 'Cashback', // 15 euros per month bonus
  INTEREST = 'Interest', // interest
  TRADE = 'Trade', // trade (buy/sell)
  DIVIDEND = 'Dividend', // dividend
  TAX_CORRECTION = 'Tax Correction', // tax correction
  RECEIVED_GIFT = 'Received Gift', // Received stock gifts from a friend (received gifts aren't included in transactions list and are added later from activities)
  STOCK_PERK = 'Stock Perk', // Received stock gifts when opening an account
  // Non-portfolio-related transactions
  SENT_GIFT = 'Sent Gift', // Sent stock gifts to a friend
  TRANSFER = 'Transfer', // Money transfers between accounts
  CARD_PAYMENT = 'Card Payment', // Merchant card payments
  STATUS_INDICATOR = 'Status Indicator', // Declined, cancelled, or verification transactions
  SAVINGS_PLAN_FOR_CHILDREN = 'Savings Plan for Children', // Savings plan for children
}
