import { TRANSACTION_EVENT_TYPE } from '@/constants';
import {
  DividendTransaction,
  CashTransaction,
  OrderTransaction,
  PortfolioData,
  CorporateActionTransaction,
  Transaction,
  TRANSACTION_TYPE,
  TransactionDataObject,
  TransactionHeaderSection,
  TransactionSection,
  TransactionTableSection,
} from '@/types';
import { identifyBuyOrSell } from '@/utils/identifyBuyOrSell';
import { parseToBigNumber } from '@/utils/parseToBigNumber';

const DEFAULT_EXCHANGE = 'LSX';
const DEFAULT_CURRENCY = 'EUR';
const SECTION_TITLE_TRANSACTION = 'Transaction';
const SECTION_TITLE_OVERVIEW = 'Overview';
const SUBSECTION_TITLE_SHARES = 'Shares';
const SUBSECTION_TITLE_SHARE_PRICE = 'Share price';
const SUBSECTION_TITLE_SHARES_ADDED = 'Shares added';
const SUBSECTION_TITLE_SHARES_REMOVED = 'Shares removed'; // No info if this is the correct name
const SUBSECTION_TITLE_CREDITED_SHARES = 'Credited shares';
const SUBSECTION_TITLE_DEBITED_SHARES = 'Debited shares';
const SUBSECTION_TITLE_TAX = 'Tax';
const SUBSECTION_TITLE_TAX_CORRECTION = 'Tax Correction';
const SUBSECTION_TITLE_FEE = 'Fee';
const SUBSECTION_TITLE_TOTAL = 'Total';

const extractIsinFromIcon = (icon: string): string => {
  const parts = icon.split('/');
  if (parts.length < 2) {
    throw new Error(`Invalid icon format: ${icon}`);
  }
  return parts[1];
};

const extractDate = (timestamp: string): string => timestamp.slice(0, 10);

const getDetailText = (
  subsection: TransactionDataObject | undefined,
): string | undefined => {
  return subsection?.detail?.displayValue?.text ?? subsection?.detail?.text;
};

const findSubsection = (
  tableSection: TransactionTableSection,
  title: string,
) => {
  return tableSection.data.find((subSection) => subSection.title === title);
};

const findTableSection = (
  sections: TransactionSection[] | undefined,
  sectionTitle: string,
): TransactionTableSection | undefined => {
  return sections?.find(
    (section): section is TransactionTableSection =>
      'title' in section &&
      section.title === sectionTitle &&
      section.type === 'table',
  );
};

const findHeaderSection = (
  sections: TransactionSection[] | undefined,
): TransactionHeaderSection | undefined => {
  return sections?.find(
    (section): section is TransactionHeaderSection =>
      'title' in section && section.type === 'header',
  );
};

const extractIsinFromHeader = (
  sections: TransactionSection[] | undefined,
): string => {
  const headerSection = findHeaderSection(sections);
  if (!headerSection?.data?.icon) {
    throw new Error('Missing icon in header section');
  }
  return extractIsinFromIcon(headerSection.data.icon);
};

const handleDividend = (transaction: Transaction): DividendTransaction => {
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
      `Missing Transaction section in dividend: ${transaction.id}`,
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

  const tax = parseToBigNumber(getDetailText(taxSubSection)).toFixed();
  const totalBeforeTax = parseToBigNumber(getDetailText(totalSubSection));
  // The total doesn't include tax, so we need to add it
  const dividendTotal = totalBeforeTax.plus(parseToBigNumber(tax)).toFixed();
  const shares = parseToBigNumber(getDetailText(sharesSubSection)).toFixed();

  // As the Dividend Per Share can be in another currency,
  // we need to calculate it with the total / shares
  const dividendPerShare = parseToBigNumber(dividendTotal)
    .dividedBy(parseToBigNumber(shares))
    .toFixed();

  return {
    title: transaction.title,
    eventType: transaction.eventType as TRANSACTION_EVENT_TYPE.DIVIDEND,
    date,
    isin,
    currency: DEFAULT_CURRENCY,
    tax,
    exchange: DEFAULT_EXCHANGE,
    shares,
    dividendPerShare,
    dividendTotal,
  };
};

const handleStockGift = (
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
      `Missing ${sectionTitle} section in stock gift: ${transaction.id}`,
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

  let titleSuffix = '';
  if (transaction.eventType === TRANSACTION_EVENT_TYPE.WELCOME_STOCK_GIFT) {
    titleSuffix = ' - Welcome Stock Gift';
  } else if (transaction.eventType === TRANSACTION_EVENT_TYPE.RECEIVED_GIFT) {
    titleSuffix = ' - Received Gift';
  } else if (transaction.eventType === TRANSACTION_EVENT_TYPE.GIVE_AWAY_GIFT) {
    titleSuffix = ' - Give Away Gift';
  }

  return {
    title: `${transaction.title}${titleSuffix}`,
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
    exchange: DEFAULT_EXCHANGE,
    fee: '0',
    tax: '0',
    taxCorrection: '0',
  };
};

const handleTradeTransaction = (transaction: Transaction): PortfolioData => {
  const date = extractDate(transaction.timestamp);
  const type = identifyBuyOrSell(transaction);
  const isin = extractIsinFromIcon(transaction.icon);
  const result: PortfolioData = [];

  let price = '';
  let quantity = '';
  let fee = '';
  let tax = '';
  let taxCorrection = '';

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
    taxCorrection = parseToBigNumber(
      getDetailText(taxCorrectionSubSection),
    ).toFixed();
    tax = parseToBigNumber(getDetailText(taxSubSection)).toFixed();
    fee = parseToBigNumber(getDetailText(feeSubSection)).toFixed();
  } else {
    // Fallback to Overview section (older format)
    const overviewSection = findTableSection(
      transaction.sections,
      SECTION_TITLE_OVERVIEW,
    );

    if (!overviewSection) {
      throw new Error(
        `Missing Transaction or Overview section in trade: ${transaction.id}`,
      );
    }

    const transactionSubSection = findSubsection(
      overviewSection,
      SECTION_TITLE_TRANSACTION,
    );
    const taxCorrectionSubSection = findSubsection(
      overviewSection,
      SUBSECTION_TITLE_TAX_CORRECTION,
    );
    const taxSubSection = findSubsection(overviewSection, SUBSECTION_TITLE_TAX);
    const feeSubSection = findSubsection(overviewSection, SUBSECTION_TITLE_FEE);

    price = parseToBigNumber(getDetailText(transactionSubSection)).toFixed();
    // In older format, quantity is in prefix
    quantity = parseToBigNumber(
      transactionSubSection?.detail?.displayValue?.prefix,
    ).toFixed();
    taxCorrection = parseToBigNumber(
      getDetailText(taxCorrectionSubSection),
    ).toFixed();
    tax = parseToBigNumber(getDetailText(taxSubSection)).toFixed();
    fee = parseToBigNumber(getDetailText(feeSubSection)).toFixed();
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
    fee,
    tax,
    taxCorrection,
    exchange: DEFAULT_EXCHANGE,
  };

  result.push(newTransaction);

  return result;
};

const handleInterest = (transaction: Transaction): CashTransaction => {
  if (!transaction.eventType) {
    throw new Error('Transaction eventType is required');
  }
  const date = extractDate(transaction.timestamp);
  const amount = parseToBigNumber(
    transaction.amount?.value?.toString(),
  ).toFixed();
  let tax = '0';

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
    tax = parseToBigNumber(taxValue).toFixed();
  }

  return {
    title: transaction.title,
    eventType: transaction.eventType as TRANSACTION_EVENT_TYPE.INTEREST,
    type: TRANSACTION_TYPE.CASH_GAIN,
    date,
    amount,
    currency: DEFAULT_CURRENCY,
    tax,
  };
};

const handleTaxCorrection = (transaction: Transaction): CashTransaction => {
  if (!transaction.eventType) {
    throw new Error('Transaction eventType is required');
  }
  const date = extractDate(transaction.timestamp);
  const amount = parseToBigNumber(
    transaction.amount?.value.toString(),
  ).toFixed();
  const type =
    transaction.amount?.value && transaction.amount.value > 0
      ? TRANSACTION_TYPE.CASH_GAIN
      : TRANSACTION_TYPE.CASH_EXPENSE;

  return {
    title: transaction.title,
    eventType: transaction.eventType as TRANSACTION_EVENT_TYPE.TAX_CORRECTION,
    type,
    date,
    amount,
    currency: DEFAULT_CURRENCY,
    tax: '0',
  };
};

const handleCorporateAction = (
  transaction: Transaction,
): CorporateActionTransaction => {
  if (!transaction.eventType) {
    throw new Error('Transaction eventType is required');
  }
  const date = extractDate(transaction.timestamp);
  const isin = extractIsinFromIcon(transaction.icon);

  const overviewSection = findTableSection(
    transaction.sections,
    SECTION_TITLE_OVERVIEW,
  );

  if (overviewSection) {
    const sharesAdded = parseToBigNumber(
      getDetailText(
        findSubsection(overviewSection, SUBSECTION_TITLE_SHARES_ADDED),
      ),
    ).toFixed();
    const sharesRemoved = parseToBigNumber(
      getDetailText(
        findSubsection(overviewSection, SUBSECTION_TITLE_SHARES_REMOVED),
      ),
    ).toFixed();

    return {
      title: `${transaction.title} - Corporate Action`,
      eventType:
        transaction.eventType as TRANSACTION_EVENT_TYPE.CORPORATE_ACTION,
      date,
      isin,
      creditedShares: sharesAdded,
      debitedShares: sharesRemoved,
    };
  }

  const transactionSection = findTableSection(
    transaction.sections,
    SECTION_TITLE_TRANSACTION,
  );

  if (!transactionSection) {
    throw Error(
      `Missing Overview and Transaction section in corporate action: ${transaction.id}`,
    );
  }

  const creditedShares = parseToBigNumber(
    getDetailText(
      findSubsection(transactionSection, SUBSECTION_TITLE_CREDITED_SHARES),
    ),
  ).toFixed();
  const debitedShares = parseToBigNumber(
    getDetailText(
      findSubsection(transactionSection, SUBSECTION_TITLE_DEBITED_SHARES),
    ),
  ).toFixed();

  return {
    title: transaction.title,
    eventType: transaction.eventType as TRANSACTION_EVENT_TYPE.CORPORATE_ACTION,
    date,
    isin,
    creditedShares,
    debitedShares,
  };
};

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

        case TRANSACTION_EVENT_TYPE.GIVE_AWAY_GIFT:
        case TRANSACTION_EVENT_TYPE.RECEIVED_GIFT:
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

        case TRANSACTION_EVENT_TYPE.CORPORATE_ACTION:
          portfolioData.push(handleCorporateAction(transaction));
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
