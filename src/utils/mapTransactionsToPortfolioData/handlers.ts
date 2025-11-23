import { TRANSACTION_EVENT_TYPE } from '../../constants';
import {
  CashTransaction,
  DividendTransaction,
  OrderTransaction,
  PortfolioData,
  Transaction,
  TRANSACTION_TYPE,
} from '../../types';
import {
  DEFAULT_CURRENCY,
  DEFAULT_EXCHANGE,
  DEFAULT_FEE_CURRENCY,
  SECTION_TITLE_OVERVIEW,
  SECTION_TITLE_TRANSACTION,
  SUBSECTION_TITLE_FEE,
  SUBSECTION_TITLE_SHARE_PRICE,
  SUBSECTION_TITLE_SHARES,
  SUBSECTION_TITLE_TAX,
  SUBSECTION_TITLE_TAX_CORRECTION,
  SUBSECTION_TITLE_TOTAL,
} from './constants';
import { identifyBuyOrSell } from './helpers';
import {
  extractDate,
  extractIsinFromHeader,
  extractIsinFromIcon,
  findSubsection,
  findTableSection,
  getDetailText,
  parseToBigNumber,
} from './utils';

export const handleDividend = (
  transaction: Transaction,
): DividendTransaction => {
  if (!transaction.eventType) {
    throw new Error('Transaction eventType is required');
  }
  const date = extractDate(transaction.timestamp);
  const isin = extractIsinFromIcon(transaction.icon);
  const transactionSection = findTableSection(
    transaction.sections,
    SECTION_TITLE_TRANSACTION,
  );

  if (!transactionSection) {
    throw new Error(
      `Missing Transaction section in dividend: ${transaction.title}`,
    );
  }

  const sharesSubSection = findSubsection(
    transactionSection,
    SUBSECTION_TITLE_SHARES,
  );
  const taxSubSection = findSubsection(
    transactionSection,
    SUBSECTION_TITLE_TAX,
  );
  const totalSubSection = findSubsection(
    transactionSection,
    SUBSECTION_TITLE_TOTAL,
  );

  const feeTax = parseToBigNumber(getDetailText(taxSubSection)).toFixed();
  const totalBeforeTax = parseToBigNumber(getDetailText(totalSubSection));
  // The total doesn't include tax, so we need to add it
  const dividendTotal = totalBeforeTax.plus(parseToBigNumber(feeTax)).toFixed();
  const shares = parseToBigNumber(getDetailText(sharesSubSection)).toFixed();

  // As the Dividend Per Share can be in another currency,
  // we need to calculate it with the total / shares
  const dividendPerShare = parseToBigNumber(dividendTotal)
    .dividedBy(parseToBigNumber(shares))
    .toFixed(2);

  return {
    title: transaction.title,
    eventType: transaction.eventType as TRANSACTION_EVENT_TYPE.DIVIDEND,
    date,
    isin,
    currency: DEFAULT_CURRENCY,
    feeTax,
    feeCurrency: DEFAULT_FEE_CURRENCY,
    exchange: DEFAULT_EXCHANGE,
    shares,
    dividendPerShare,
    dividendTotal,
  };
};

export const handleStockGift = (
  transaction: Transaction,
  sectionTitle: string,
): OrderTransaction => {
  if (!transaction.eventType) {
    throw new Error('Transaction eventType is required');
  }
  const date = extractDate(transaction.timestamp);
  const type = identifyBuyOrSell(transaction);
  const isin = extractIsinFromHeader(transaction.sections);
  const transactionSection = findTableSection(
    transaction.sections,
    sectionTitle,
  );

  if (!transactionSection) {
    throw new Error(
      `Missing ${sectionTitle} section in stock gift: ${transaction.title}`,
    );
  }

  const sharesSubSection = findSubsection(
    transactionSection,
    SUBSECTION_TITLE_SHARES,
  );
  const sharePriceSubSection = findSubsection(
    transactionSection,
    SUBSECTION_TITLE_SHARE_PRICE,
  );

  const quantity = parseToBigNumber(getDetailText(sharesSubSection)).toFixed();
  const price = parseToBigNumber(getDetailText(sharePriceSubSection)).toFixed();

  return {
    title: transaction.title,
    eventType: transaction.eventType as
      | TRANSACTION_EVENT_TYPE.WELCOME_STOCK_GIFT
      | TRANSACTION_EVENT_TYPE.RECEIVED_GIFT
      | TRANSACTION_EVENT_TYPE.GIVE_AWAY_GIFT,
    type,
    date,
    isin,
    price,
    quantity,
    currency: DEFAULT_CURRENCY,
    feeTax: '0',
    exchange: DEFAULT_EXCHANGE,
    feeCurrency: DEFAULT_FEE_CURRENCY,
  };
};

export const handleTradeTransaction = (
  transaction: Transaction,
): PortfolioData => {
  const date = extractDate(transaction.timestamp);
  const type = identifyBuyOrSell(transaction);
  const isin = extractIsinFromIcon(transaction.icon);
  const result: PortfolioData = [];

  let price = '';
  let quantity = '';
  let feeTax = '';
  let taxCorrectionAmount = '';

  // Try to find Transaction section first (newer format)
  const transactionSection = findTableSection(
    transaction.sections,
    SECTION_TITLE_TRANSACTION,
  );

  if (transactionSection) {
    const sharesSubSection = findSubsection(
      transactionSection,
      SUBSECTION_TITLE_SHARES,
    );
    const sharePriceSubSection = findSubsection(
      transactionSection,
      SUBSECTION_TITLE_SHARE_PRICE,
    );
    const taxSubSection = findSubsection(
      transactionSection,
      SUBSECTION_TITLE_TAX,
    );
    const taxCorrectionSubSection = findSubsection(
      transactionSection,
      SUBSECTION_TITLE_TAX_CORRECTION,
    );
    const feeSubSection = findSubsection(
      transactionSection,
      SUBSECTION_TITLE_FEE,
    );

    quantity = parseToBigNumber(getDetailText(sharesSubSection)).toFixed();
    price = parseToBigNumber(getDetailText(sharePriceSubSection)).toFixed();

    // Happens in sell orders, when the tax correction is a refund
    taxCorrectionAmount = parseToBigNumber(
      getDetailText(taxCorrectionSubSection),
    ).toFixed();

    const taxValue = getDetailText(taxSubSection);
    const feeText = getDetailText(feeSubSection);
    feeTax = parseToBigNumber(feeText)
      .plus(parseToBigNumber(taxValue))
      .toFixed();
  } else {
    // Fallback to Overview section (older format)
    const overviewSection = findTableSection(
      transaction.sections,
      SECTION_TITLE_OVERVIEW,
    );

    if (!overviewSection) {
      throw new Error(
        `Missing Transaction or Overview section in trade: ${transaction.title}`,
      );
    }

    const transactionSubSection = findSubsection(
      overviewSection,
      SECTION_TITLE_TRANSACTION,
    );
    const taxSubSection = findSubsection(overviewSection, SUBSECTION_TITLE_TAX);
    const feeSubSection = findSubsection(overviewSection, SUBSECTION_TITLE_FEE);

    price = parseToBigNumber(getDetailText(transactionSubSection)).toFixed();
    // In older format, quantity is in prefix
    quantity = parseToBigNumber(
      transactionSubSection?.detail?.displayValue?.prefix,
    ).toFixed();

    const taxValue = getDetailText(taxSubSection);
    const feeText = getDetailText(feeSubSection);
    feeTax = parseToBigNumber(feeText)
      .plus(parseToBigNumber(taxValue))
      .toFixed();
  }

  if (!transaction.eventType) {
    throw new Error('Transaction eventType is required');
  }

  const newTransaction = {
    title: transaction.title,
    eventType: transaction.eventType as
      | TRANSACTION_EVENT_TYPE.TRADE
      | TRANSACTION_EVENT_TYPE.SAVINGS_PLAN
      | TRANSACTION_EVENT_TYPE.ROUNDUP
      | TRANSACTION_EVENT_TYPE.CASHBACK,
    type,
    date,
    isin,
    price,
    quantity,
    currency: DEFAULT_CURRENCY,
    feeTax,
    exchange: DEFAULT_EXCHANGE,
    feeCurrency: DEFAULT_FEE_CURRENCY,
  };

  result.push(newTransaction);

  // If there's a tax correction, create a separate cash gain transaction
  if (parseToBigNumber(taxCorrectionAmount).isGreaterThan(0)) {
    const taxCorrectionTransaction: CashTransaction = {
      title: `${transaction.title} - Tax Correction`,
      eventType: TRANSACTION_EVENT_TYPE.TAX_CORRECTION,
      type: TRANSACTION_TYPE.CASH_GAIN,
      date,
      amount: taxCorrectionAmount,
      currency: DEFAULT_CURRENCY,
      feeTax: '0',
      feeCurrency: DEFAULT_FEE_CURRENCY,
    };
    result.push(taxCorrectionTransaction);
  }

  return result;
};

export const handleInterest = (transaction: Transaction): CashTransaction => {
  if (!transaction.eventType) {
    throw new Error('Transaction eventType is required');
  }
  const date = extractDate(transaction.timestamp);
  const amount = parseToBigNumber(
    transaction.amount.value.toString(),
  ).toFixed();
  let feeTax = '0';

  const transactionSection = findTableSection(
    transaction.sections,
    SECTION_TITLE_TRANSACTION,
  );

  if (transactionSection) {
    const taxSubSection = findSubsection(
      transactionSection,
      SUBSECTION_TITLE_TAX,
    );
    const taxValue = getDetailText(taxSubSection);
    feeTax = parseToBigNumber(taxValue).toFixed();
  }

  return {
    title: transaction.title,
    eventType: transaction.eventType as TRANSACTION_EVENT_TYPE.INTEREST,
    type: TRANSACTION_TYPE.CASH_GAIN,
    date,
    amount,
    currency: DEFAULT_CURRENCY,
    feeTax,
    feeCurrency: DEFAULT_FEE_CURRENCY,
  };
};

export const handleTaxCorrection = (
  transaction: Transaction,
): CashTransaction => {
  if (!transaction.eventType) {
    throw new Error('Transaction eventType is required');
  }
  const date = extractDate(transaction.timestamp);
  const amount = parseToBigNumber(
    Math.abs(transaction.amount.value).toString(),
  ).toFixed();
  const type = parseToBigNumber(
    transaction.amount.value.toString(),
  ).isGreaterThan(0)
    ? TRANSACTION_TYPE.CASH_GAIN
    : TRANSACTION_TYPE.CASH_EXPENSE;

  return {
    title: transaction.title,
    eventType: transaction.eventType as TRANSACTION_EVENT_TYPE.TAX_CORRECTION,
    type,
    date,
    amount,
    currency: DEFAULT_CURRENCY,
    feeTax: '0',
    feeCurrency: DEFAULT_FEE_CURRENCY,
  };
};
