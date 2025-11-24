import { TRANSACTION_EVENT_TYPE } from '@/constants';
import { PortfolioData, Transaction } from '@/types';
import {
  handleDividend,
  handleInterest,
  handleStockGift,
  handleTaxCorrection,
  handleTradeTransaction,
} from './handlers';
import { SECTION_TITLE_OVERVIEW, SECTION_TITLE_TRANSACTION } from './constants';

export const mapTransactionsToPortfolioData = (
  transactions: Transaction[],
): PortfolioData => {
  if (!transactions?.length) {
    console.warn(
      'No data provided to convert to PortfolioData. No file will be created.',
    );
    return [];
  }

  const portfolioData: PortfolioData = [];

  for (const transaction of transactions) {
    try {
      // Skip cancelled transactions - they shouldn't be included in portfolio data
      if (transaction.status === 'CANCELED') {
        continue;
      }

      // Skip transactions without eventType (shouldn't happen with current identifyEventType, but kept as safety net)
      if (!transaction.eventType) {
        console.warn(
          `Transaction without eventType skipped: ${transaction.title} | ${transaction.subtitle}`,
        );
        continue;
      }

      // Route to appropriate handler based on event type
      switch (transaction.eventType) {
        case TRANSACTION_EVENT_TYPE.DIVIDEND:
          portfolioData.push(handleDividend(transaction));
          break;

        case TRANSACTION_EVENT_TYPE.WELCOME_STOCK_GIFT:
          portfolioData.push(
            handleStockGift(transaction, SECTION_TITLE_TRANSACTION),
          );
          break;

        case TRANSACTION_EVENT_TYPE.RECEIVED_GIFT:
          portfolioData.push(
            handleStockGift(transaction, SECTION_TITLE_OVERVIEW),
          );
          break;

        case TRANSACTION_EVENT_TYPE.GIVE_AWAY_GIFT:
          portfolioData.push(
            handleStockGift(transaction, SECTION_TITLE_OVERVIEW),
          );
          break;

        case TRANSACTION_EVENT_TYPE.TRADE:
        case TRANSACTION_EVENT_TYPE.SAVINGS_PLAN:
        case TRANSACTION_EVENT_TYPE.ROUNDUP:
        case TRANSACTION_EVENT_TYPE.CASHBACK:
          portfolioData.push(...handleTradeTransaction(transaction));
          break;

        case TRANSACTION_EVENT_TYPE.INTEREST:
          portfolioData.push(handleInterest(transaction));
          break;

        case TRANSACTION_EVENT_TYPE.TAX_CORRECTION:
          portfolioData.push(handleTaxCorrection(transaction));
          break;

        default:
          // Unhandled event types are silently ignored
          break;
      }
    } catch (error) {
      console.error(
        `Error processing transaction ${transaction.id} (${transaction.title}):`,
        error instanceof Error ? error.message : String(error),
      );
      // Continue processing other transactions even if one fails
    }
  }

  return portfolioData;
};
