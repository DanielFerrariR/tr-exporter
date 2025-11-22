import axios from 'axios';
import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { SIGN_TO_CURRENCY_MAP, TRANSACTION_EVENT_TYPE } from '../constants';
import {
  PortfolioData,
  Transaction,
  TRANSACTION_TYPE,
  TransactionDocumentsSection,
  TransactionHeaderSection,
  TransactionTableSection,
} from '../types';
import {
  parseTransactionDividendPdf,
  TransactionPdfData,
} from './parseTransactionDividendPdf';
import { identifyBuyOrSell } from './identifyBuyOrSell';
import { parseToBigNumber } from './parseToBigNumber';

const DIVIDEND_PDFS_DATA_FILE = join(
  process.cwd(),
  'build',
  'dividendPdfsData.json',
);

/**
 * Generates a unique key for caching PDF data based on the document URL
 */
const getPdfFilename = (
  documentUrl: string,
  date: string,
  isin: string,
): string => {
  const urlHash = createHash('md5')
    .update(documentUrl)
    .digest('hex')
    .slice(0, 8);
  return `${date}_${isin}_${urlHash}.pdf`;
};

/**
 * Loads dividend PDFs data from JSON file
 */
const loadDividendPdfsData = (): Record<string, TransactionPdfData> => {
  if (!existsSync(DIVIDEND_PDFS_DATA_FILE)) {
    return {};
  }

  try {
    const data = readFileSync(DIVIDEND_PDFS_DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn(
      `Error reading ${DIVIDEND_PDFS_DATA_FILE}, will parse PDFs instead:`,
      error,
    );
    return {};
  }
};

/**
 * Saves dividend PDFs data to JSON file
 */
const saveDividendPdfsData = (
  pdfData: Record<string, TransactionPdfData>,
): void => {
  try {
    writeFileSync(
      DIVIDEND_PDFS_DATA_FILE,
      JSON.stringify(pdfData, null, 2),
      'utf8',
    );
  } catch (error) {
    console.error(`Error saving ${DIVIDEND_PDFS_DATA_FILE}:`, error);
  }
};

export const mapTransactionsToPortfolioData = async (
  transactions: Transaction[],
): Promise<PortfolioData> => {
  if (!transactions?.length) {
    console.warn(
      'No data provided to convert to PortfolioData. No file will be created.',
    );
    return [];
  }

  // Load existing dividend PDFs data from JSON
  const dividendPdfsData = loadDividendPdfsData();
  let dividendPdfsDataUpdated = false;

  const portfolioData: PortfolioData = [];

  for (const transaction of transactions) {
    // Skip cancelled transactions - they shouldn't be included in portfolio data
    if (transaction.status === 'CANCELED') {
      continue;
    }

    // Skip non-portfolio transactions (transfers, card payments, status indicators, sent stock gifts)
    if (
      transaction.eventType === TRANSACTION_EVENT_TYPE.TRANSFER ||
      transaction.eventType === TRANSACTION_EVENT_TYPE.CARD_PAYMENT ||
      transaction.eventType === TRANSACTION_EVENT_TYPE.STATUS_INDICATOR ||
      transaction.eventType === TRANSACTION_EVENT_TYPE.SENT_GIFT
    ) {
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

          if (!documentUrl) {
            console.warn(
              `No document URL found for dividend transaction: ${title}`,
            );
            continue;
          }

          // Generate filename for the PDF
          const pdfFilename = getPdfFilename(documentUrl, date, isin);

          // Check if we have cached data in JSON
          let parsedPdf: TransactionPdfData;
          if (dividendPdfsData[pdfFilename]) {
            // Use cached data from JSON
            parsedPdf = dividendPdfsData[pdfFilename];
          } else {
            // Download and parse PDF, then cache the result
            const response = await axios.get(documentUrl, {
              responseType: 'arraybuffer',
            });
            const pdfBuffer = Buffer.from(response.data);

            parsedPdf = await parseTransactionDividendPdf(pdfBuffer);

            // Cache the parsed data
            dividendPdfsData[pdfFilename] = parsedPdf;
            dividendPdfsDataUpdated = true;
          }

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
      const eventType = transaction.eventType;
      const type = identifyBuyOrSell(transaction);
      const date = transaction.timestamp.slice(0, 10);
      const title = transaction.title;
      const exchange = 'LS-X';
      let isin = '';
      let price = '';
      let quantity = '';
      let currency = '';
      const feeTax = '';
      const feeCurrency = '';

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
          const currencySign = sharePriceSubSection?.detail?.text?.[0];
          currency = currencySign
            ? (SIGN_TO_CURRENCY_MAP[currencySign] ?? '')
            : '';
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
      let isin = '';
      let price = '';
      let quantity = '';
      let currency = '';
      const feeTax = '';
      const feeCurrency = '';

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
          const currencySign = sharePriceSubSection?.detail?.text?.[0];
          currency = currencySign
            ? (SIGN_TO_CURRENCY_MAP[currencySign] ?? '')
            : '';
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
          const currencySign = sharePriceSubSection?.detail?.text?.[0];
          currency = currencySign
            ? (SIGN_TO_CURRENCY_MAP[currencySign] ?? '')
            : '';

          const feeText = feeSubSection?.detail?.text;
          feeTax =
            feeText === 'Free' || !feeText ? '' : (feeText?.slice(1) ?? '');
          const feeCurrencySign = feeText?.[0];
          feeCurrency =
            feeText === 'Free' || !feeText || !feeTax || !feeCurrencySign
              ? ''
              : (SIGN_TO_CURRENCY_MAP[feeCurrencySign] ?? '');
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
            const currencySign =
              transactionSubSection?.detail?.displayValue?.text?.[0];
            currency = currencySign
              ? (SIGN_TO_CURRENCY_MAP[currencySign] ?? '')
              : '';
          }

          if (feeSubSection && !feeTax) {
            const feeText = feeSubSection?.detail?.text;
            feeTax =
              feeText === 'Free' || !feeText ? '' : (feeText?.slice(1) ?? '');
            const feeCurrencySign = feeText?.[0];
            feeCurrency =
              feeText === 'Free' || !feeText || !feeTax || !feeCurrencySign
                ? ''
                : (SIGN_TO_CURRENCY_MAP[feeCurrencySign] ?? '');
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
      const eventType = transaction.eventType;
      const type: TRANSACTION_TYPE.CASH_GAIN | TRANSACTION_TYPE.CASH_EXPENSE =
        TRANSACTION_TYPE.CASH_GAIN;
      const date = transaction.timestamp.slice(0, 10);
      const title = transaction.title;
      const currency = transaction.amount.currency;
      const amount = parseToBigNumber(
        transaction.amount.value.toString(),
      ).toFixed();
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
          const taxCurrencySign = taxValue?.[0];
          feeCurrency =
            feeTax && taxCurrencySign
              ? (SIGN_TO_CURRENCY_MAP[taxCurrencySign] ?? '')
              : '';
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
      const currency = transaction.amount.currency;
      const feeTax = '';
      const feeCurrency = '';

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

  // Save updated dividend PDFs data to JSON if it was modified
  if (dividendPdfsDataUpdated) {
    saveDividendPdfsData(dividendPdfsData);
  }

  return portfolioData;
};
