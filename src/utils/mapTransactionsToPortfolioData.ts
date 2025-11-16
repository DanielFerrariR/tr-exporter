import axios from 'axios';
import { SIGN_TO_CURRENCY_MAP, TRANSACTION_EVENT_TYPE } from '../constants';
import {
  PortfolioData,
  Transaction,
  TRANSACTION_TYPE,
  TransactionDocumentsSection,
  TransactionHeaderSection,
  TransactionTableSection,
} from '../types';
import { parseTransactionDividendPdf } from './parseTransactionDividendPdf';
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

  let portfolioData: PortfolioData = [];

  for (const transaction of transactions) {
    if (transaction.status === 'CANCELED') continue;

    if (!transaction.eventType) continue;

    // Dividends
    if (transaction.eventType === TRANSACTION_EVENT_TYPE.DIVIDEND) {
      let title = transaction.title;
      let eventType = transaction.eventType;
      let date = transaction.timestamp.slice(0, 10);
      let isin = transaction.icon.split('/')[1];
      let exchange = 'LS-X';
      let dividendTotal = '';
      let dividendPerShare = '';
      let shares = '';
      let currency = '';
      let feeTax = '';
      let feeCurrency = '';

      for (const section of transaction.sections ?? []) {
        if ('title' in section && section.title === 'Documents') {
          const documentSection = section as TransactionDocumentsSection;
          const documentUrl = documentSection.data[0]?.action?.payload;
          const response = await axios.get(documentUrl, {
            responseType: 'arraybuffer',
          });
          const parsedPdf = await parseTransactionDividendPdf(
            Buffer.from(response.data),
          );
          dividendTotal = parsedPdf.dividendTotal;
          dividendPerShare = parsedPdf.dividendPerShare;
          shares = parsedPdf.shares;
          currency = parsedPdf.currency;
          feeTax = parsedPdf.taxAmount;
          feeCurrency = parsedPdf.taxCurrency;
        }
      }

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
      let eventType = transaction.eventType;
      let type = identifyBuyOrSell(transaction);
      let date = transaction.timestamp.slice(0, 10);
      let title = transaction.title;
      let exchange = 'LS-X';
      let isin = '';
      let price = '';
      let quantity = '';
      let currency = '';
      let feeTax = '';
      let feeCurrency = '';

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
            sharesSubSection?.detail?.text ?? '0',
          ).toFixed();
          price = parseToBigNumber(
            sharePriceSubSection?.detail?.text?.slice(1) ?? '0',
          ).toFixed();
          currency =
            SIGN_TO_CURRENCY_MAP[sharePriceSubSection?.detail?.text?.[0]!];
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
    if (transaction.eventType === TRANSACTION_EVENT_TYPE.GIFT) {
      let eventType = transaction.eventType;
      let type = identifyBuyOrSell(transaction);
      let date = transaction.timestamp.slice(0, 10);
      let title = transaction.title;
      let exchange = 'LS-X';
      let isin = '';
      let price = '';
      let quantity = '';
      let currency = '';
      let feeTax = '';
      let feeCurrency = '';

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
            sharesSubSection?.detail?.text ?? '0',
          ).toFixed();
          price = parseToBigNumber(
            sharePriceSubSection?.detail?.text?.slice(1) ?? '0',
          ).toFixed();
          currency =
            SIGN_TO_CURRENCY_MAP[sharePriceSubSection?.detail?.text?.[0]!];
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
      let eventType = transaction.eventType;
      let type = identifyBuyOrSell(transaction);
      let date = transaction.timestamp.slice(0, 10);
      let isin = transaction.icon.split('/')[1];
      let exchange = 'LS-X';
      let title = transaction.title;
      let price = '';
      let quantity = '';
      let currency = '';
      let feeTax = '';
      let feeCurrency = '';

      transaction.sections?.forEach((section) => {
        // Check for "Transaction" section (newer format)
        if ('title' in section && section.title === 'Transaction') {
          const tableSection = section as TransactionTableSection;
          const sharesSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Shares',
          );
          const sharePriceSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Share price',
          );
          const feeSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Fee',
          );

          quantity = parseToBigNumber(
            sharesSubSection?.detail?.text ?? '0',
          ).toFixed();
          price = parseToBigNumber(
            sharePriceSubSection?.detail?.text?.slice(1) ?? '0',
          ).toFixed();
          currency =
            SIGN_TO_CURRENCY_MAP[sharePriceSubSection?.detail?.text?.[0]!];

          const feeText = feeSubSection?.detail?.text;
          feeTax =
            feeText === 'Free' || !feeText ? '' : (feeText?.slice(1) ?? '');
          feeCurrency =
            feeText === 'Free' || !feeText || !feeTax
              ? ''
              : (SIGN_TO_CURRENCY_MAP[feeText?.[0]!] ?? '');
        }

        // Check for "Overview" section with Transaction subsection (older format)
        if ('title' in section && section.title === 'Overview') {
          const tableSection = section as TransactionTableSection;
          const transactionSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Transaction',
          );
          const feeSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Fee',
          );

          // Only use this if we haven't already found data in Transaction section
          if (transactionSubSection && !price) {
            price = parseToBigNumber(
              transactionSubSection?.detail?.displayValue?.text?.slice(1) ??
                '0',
            ).toFixed();
            quantity = parseToBigNumber(
              transactionSubSection?.detail?.displayValue?.prefix?.slice(
                0,
                -3,
              ) ?? '0',
            ).toFixed();
            currency =
              SIGN_TO_CURRENCY_MAP[
                transactionSubSection?.detail?.displayValue?.text?.[0]!
              ];
          }

          if (feeSubSection && !feeTax) {
            const feeText = feeSubSection?.detail?.text;
            feeTax =
              feeText === 'Free' || !feeText ? '' : (feeText?.slice(1) ?? '');
            feeCurrency =
              feeText === 'Free' || !feeText || !feeTax
                ? ''
                : (SIGN_TO_CURRENCY_MAP[feeText?.[0]!] ?? '');
          }
        }
      });

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
      continue;
    }

    // Interest
    if (transaction.eventType === TRANSACTION_EVENT_TYPE.INTEREST) {
      let eventType = transaction.eventType;
      let type = TRANSACTION_TYPE.CASH_GAIN;
      let date = transaction.timestamp.slice(0, 10);
      let title = transaction.title;
      let currency = transaction.amount.currency;
      let amount = parseToBigNumber(
        transaction.amount.value.toString(),
      ).toFixed(2);
      let feeTax = '';
      let feeCurrency = '';

      // New interest format includes tax, but the old one does not
      transaction.sections?.forEach((section) => {
        if ('title' in section && section.title === 'Transaction') {
          const tableSection = section as TransactionTableSection;
          const taxSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Tax',
          );

          const taxValue = taxSubSection?.detail?.text;
          feeTax = taxValue?.slice(1) ?? '';
          if (feeTax === '0.00') feeTax = '';
          feeCurrency = feeTax ? SIGN_TO_CURRENCY_MAP[taxValue?.[0]!] : '';
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
      let eventType = transaction.eventType;
      let type = parseToBigNumber(
        transaction.amount.value.toString(),
      ).isGreaterThan(0)
        ? TRANSACTION_TYPE.CASH_GAIN
        : TRANSACTION_TYPE.CASH_EXPENSE;
      let date = transaction.timestamp.slice(0, 10);
      let title = transaction.title;
      let amount = parseToBigNumber(
        Math.abs(transaction.amount.value).toString(),
      ).toFixed();
      let currency = transaction.amount.currency;
      let feeTax = '';
      let feeCurrency = '';

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
