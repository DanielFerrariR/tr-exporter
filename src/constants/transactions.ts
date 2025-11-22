export enum TRANSACTION_EVENT_TYPE {
  SAVINGS_PLAN = 'Saving Plan', // savings plan
  ROUNDUP = 'Roundup', // roundup
  CASHBACK = 'Cashback', // 15 euros per month bonus
  INTEREST = 'Interest', // interest
  TRADE = 'Trade', // trade (buy/sell)
  DIVIDEND = 'Dividend', // dividend
  TAX_CORRECTION = 'Tax Correction', // tax correction
  GIFT = 'Gift', // Received stock gifts from a friend
  STOCK_PERK = 'Stock Perk', // Received stock gifts when opening an account
  TRANSFER = 'Transfer', // Money transfers between accounts
  CARD_PAYMENT = 'Card Payment', // Merchant card payments
  STATUS_INDICATOR = 'Status Indicator', // Declined, cancelled, or verification transactions
}
