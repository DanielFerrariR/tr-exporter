import { TRANSACTION_EVENT_TYPE } from '../constants';
import {
  CashTransaction,
  PortfolioData,
  Transaction,
  TRANSACTION_TYPE,
  TransactionHeaderSection,
  TransactionTableSection,
} from '../types';
import { identifyBuyOrSell } from './identifyBuyOrSell';
import { parseToBigNumber } from './parseToBigNumber';

export const mapTransactionsToPortfolioData = async (
  transactions: Transaction[],
): Promise<PortfolioData> => {
  if (!transactions?.length) {
    console.warn(
      'No data provided to convert to PortfolioData. No file will be created.',
    );
    return [];
  }

  const portfolioData: PortfolioData = [];

  for (const transaction of transactions) {
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

    // Dividends
    if (transaction.eventType === TRANSACTION_EVENT_TYPE.DIVIDEND) {
      const title = transaction.title;
      const eventType = transaction.eventType;
      const date = transaction.timestamp.slice(0, 10);
      const isin = transaction.icon.split('/')[1];
      const exchange = 'LS-X';
      // Currently all transactions are in EUR
      const currency = 'EUR';
      const feeCurrency = 'EUR';
      let dividendTotal = '';
      let dividendPerShare = '';
      let shares = '';
      let feeTax = '';

      transaction.sections?.forEach((section) => {
        if ('title' in section && section.title === 'Transaction') {
          const tableSection = section as TransactionTableSection;
          const sharesSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Shares',
          );
          const taxSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Tax',
          );
          const totalSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Total',
          );
          feeTax = parseToBigNumber(
            taxSubSection?.detail?.displayValue?.text ??
              taxSubSection?.detail?.text,
          ).toFixed();
          // The total doesn't include tax, so we need to add it
          dividendTotal = parseToBigNumber(
            totalSubSection?.detail?.displayValue?.text ??
              totalSubSection?.detail?.text,
          )
            .plus(parseToBigNumber(feeTax))
            .toFixed();
          shares = parseToBigNumber(
            sharesSubSection?.detail?.displayValue?.text ??
              sharesSubSection?.detail?.text,
          ).toFixed();
          // As the Dividend Per Share can be in another currency,
          // we need to calculate it with the total / shares
          dividendPerShare = parseToBigNumber(dividendTotal)
            .dividedBy(parseToBigNumber(shares))
            .toFixed(2);
        }
      });

      portfolioData.push({
        title,
        eventType,
        date,
        isin,
        currency,
        feeTax,
        feeCurrency,
        exchange,
        shares,
        dividendPerShare,
        dividendTotal,
      });

      continue;
    }

    // Received Stock gifts when opening an account
    if (transaction.eventType === TRANSACTION_EVENT_TYPE.STOCK_PERK) {
      const eventType = transaction.eventType;
      const type = identifyBuyOrSell(transaction);
      const date = transaction.timestamp.slice(0, 10);
      const title = transaction.title;
      const exchange = 'LS-X';
      // Currently all transactions are in EUR
      const currency = 'EUR';
      const feeCurrency = 'EUR';
      let isin = '';
      let price = '';
      let quantity = '';
      const feeTax = '0';

      transaction.sections?.forEach((section) => {
        if ('title' in section && section.type === 'header') {
          const headerSection = section as TransactionHeaderSection;
          isin = headerSection?.data?.icon?.split('/')[1];
        }
        if ('title' in section && section.title === 'Transaction') {
          const tableSection = section as TransactionTableSection;
          const sharesSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Shares',
          );
          const sharePriceSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Share price',
          );
          quantity = parseToBigNumber(
            sharesSubSection?.detail?.displayValue?.text ??
              sharesSubSection?.detail?.text,
          ).toFixed();
          price = parseToBigNumber(
            sharePriceSubSection?.detail?.displayValue?.text ??
              sharePriceSubSection?.detail?.text,
          ).toFixed();
        }
      });

      portfolioData.push({
        title,
        eventType,
        type,
        date,
        isin,
        price,
        quantity,
        currency,
        feeTax,
        exchange,
        feeCurrency,
      });

      continue;
    }

    // Received stock gifts from a friend
    if (transaction.eventType === TRANSACTION_EVENT_TYPE.RECEIVED_GIFT) {
      const eventType = transaction.eventType;
      const type = identifyBuyOrSell(transaction);
      const date = transaction.timestamp.slice(0, 10);
      const title = transaction.title;
      const exchange = 'LS-X';
      // Currently all transactions are in EUR
      const currency = 'EUR';
      const feeCurrency = 'EUR';
      let isin = '';
      let price = '';
      let quantity = '';
      const feeTax = '0';

      transaction.sections?.forEach((section) => {
        if ('title' in section && section.type === 'header') {
          const headerSection = section as TransactionHeaderSection;
          isin = headerSection?.data?.icon?.split('/')[1];
        }
        if ('title' in section && section.title === 'Overview') {
          const tableSection = section as TransactionTableSection;
          const sharesSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Shares',
          );
          const sharePriceSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Share price',
          );
          quantity = parseToBigNumber(
            sharesSubSection?.detail?.displayValue?.text ??
              sharesSubSection?.detail?.text,
          ).toFixed();
          price = parseToBigNumber(
            sharePriceSubSection?.detail?.displayValue?.text ??
              sharePriceSubSection?.detail?.text,
          ).toFixed();
        }
      });

      portfolioData.push({
        title,
        eventType,
        type,
        date,
        isin,
        price,
        quantity,
        currency,
        feeTax,
        exchange,
        feeCurrency,
      });

      continue;
    }

    // Buy and Sell transactions (trades, savings plans, roundups and 15 euros per month bonus)
    if (
      transaction.eventType === TRANSACTION_EVENT_TYPE.TRADE ||
      transaction.eventType === TRANSACTION_EVENT_TYPE.SAVINGS_PLAN ||
      transaction.eventType === TRANSACTION_EVENT_TYPE.ROUNDUP ||
      transaction.eventType === TRANSACTION_EVENT_TYPE.CASHBACK
    ) {
      const eventType = transaction.eventType;
      const type = identifyBuyOrSell(transaction);
      const date = transaction.timestamp.slice(0, 10);
      const isin = transaction.icon.split('/')[1];
      const exchange = 'LS-X';
      const title = transaction.title;
      // Currently all transactions are in EUR
      const currency = 'EUR';
      const feeCurrency = 'EUR';
      let price = '';
      let quantity = '';
      let feeTax = '';
      let taxCorrectionAmount = ''; // Track tax correction separately

      for (const section of transaction.sections ?? []) {
        // Check for "Transaction" section (newer format)
        if ('title' in section && section.title === 'Transaction') {
          const tableSection = section as TransactionTableSection;
          const sharesSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Shares',
          );
          const sharePriceSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Share price',
          );
          const taxSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Tax',
          );
          const taxCorrectionSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Tax Correction',
          );
          const feeSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Fee',
          );

          quantity = parseToBigNumber(
            sharesSubSection?.detail?.displayValue?.text ??
              sharesSubSection?.detail?.text,
          ).toFixed();
          price = parseToBigNumber(
            sharePriceSubSection?.detail?.displayValue?.text ??
              sharePriceSubSection?.detail?.text,
          ).toFixed();

          // Happens in sell orders, when the tax correction is a refund
          taxCorrectionAmount = parseToBigNumber(
            taxCorrectionSubSection?.detail?.displayValue?.text ??
              taxCorrectionSubSection?.detail?.text,
          ).toFixed();

          const taxValue =
            taxSubSection?.detail?.displayValue?.text ??
            taxSubSection?.detail?.text;
          const feeText =
            feeSubSection?.detail?.displayValue?.text ??
            feeSubSection?.detail?.text;
          feeTax = parseToBigNumber(feeText)
            .plus(parseToBigNumber(taxValue))
            .toFixed();
          break;
        }
        // Check for "Overview" section with Transaction subsection, only if transactions section doesn't exist
        if ('title' in section && section.title === 'Overview') {
          const tableSection = section as TransactionTableSection;
          const transactionSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Transaction',
          );
          const taxSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Tax',
          );
          const feeSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Fee',
          );

          // Only use this if we haven't already found data in Transaction section
          price = parseToBigNumber(
            transactionSubSection?.detail?.displayValue?.text ??
              transactionSubSection?.detail?.text,
          ).toFixed();
          quantity = parseToBigNumber(
            transactionSubSection?.detail?.displayValue?.prefix,
          ).toFixed();
          const taxValue =
            taxSubSection?.detail?.displayValue?.text ??
            taxSubSection?.detail?.text;
          const feeText =
            feeSubSection?.detail?.displayValue?.text ??
            feeSubSection?.detail?.text;
          feeTax = parseToBigNumber(feeText)
            .plus(parseToBigNumber(taxValue))
            .toFixed();
        }
      }

      const newTransaction = {
        title,
        eventType,
        type,
        date,
        isin,
        price,
        quantity,
        currency,
        feeTax,
        exchange,
        feeCurrency,
      };

      portfolioData.push(newTransaction);

      // If there's a tax correction, create a separate cash gain transaction
      if (parseToBigNumber(taxCorrectionAmount).isGreaterThan(0)) {
        const taxCorrectionTransaction: CashTransaction = {
          title: `${title} - Tax Correction`,
          eventType: TRANSACTION_EVENT_TYPE.TAX_CORRECTION,
          type: TRANSACTION_TYPE.CASH_GAIN,
          date,
          amount: taxCorrectionAmount,
          currency,
          feeTax: '0',
          feeCurrency,
        };
        portfolioData.push(taxCorrectionTransaction);
      }

      continue;
    }

    // Interest
    if (transaction.eventType === TRANSACTION_EVENT_TYPE.INTEREST) {
      const eventType = transaction.eventType;
      const type: TRANSACTION_TYPE.CASH_GAIN | TRANSACTION_TYPE.CASH_EXPENSE =
        TRANSACTION_TYPE.CASH_GAIN;
      const date = transaction.timestamp.slice(0, 10);
      const title = transaction.title;
      const amount = parseToBigNumber(
        transaction.amount.value.toString(),
      ).toFixed();
      // Currently all transactions are in EUR
      const currency = 'EUR';
      const feeCurrency = 'EUR';
      // For very old interest format, feeTax is always 0
      let feeTax = '0';

      transaction.sections?.forEach((section) => {
        if ('title' in section && section.title === 'Transaction') {
          const tableSection = section as TransactionTableSection;
          const taxSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Tax',
          );

          const taxValue =
            taxSubSection?.detail?.displayValue?.text ??
            taxSubSection?.detail?.text;
          feeTax = parseToBigNumber(taxValue).toFixed();
        }
      });

      const newTransaction = {
        title,
        eventType,
        type,
        date,
        amount,
        currency,
        feeTax,
        feeCurrency,
      };

      portfolioData.push(newTransaction);
      continue;
    }

    // tax corrections
    if (transaction.eventType === TRANSACTION_EVENT_TYPE.TAX_CORRECTION) {
      const eventType = transaction.eventType;
      const type: TRANSACTION_TYPE.CASH_GAIN | TRANSACTION_TYPE.CASH_EXPENSE =
        parseToBigNumber(transaction.amount.value.toString()).isGreaterThan(0)
          ? TRANSACTION_TYPE.CASH_GAIN
          : TRANSACTION_TYPE.CASH_EXPENSE;
      const date = transaction.timestamp.slice(0, 10);
      const title = transaction.title;
      const amount = parseToBigNumber(
        Math.abs(transaction.amount.value).toString(),
      ).toFixed();
      // Currently all transactions are in EUR
      const currency = 'EUR';
      const feeCurrency = 'EUR';
      const feeTax = '0';

      const newTransaction = {
        title,
        eventType,
        type,
        date,
        amount,
        currency,
        feeTax,
        feeCurrency,
      };

      portfolioData.push(newTransaction);
      continue;
    }
  }

  return portfolioData;
};
