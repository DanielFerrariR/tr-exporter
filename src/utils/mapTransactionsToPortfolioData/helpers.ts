import { BigNumber } from 'bignumber.js';
import { TRANSACTION_EVENT_TYPE } from '../../constants';
import {
  Transaction,
  TRANSACTION_TYPE,
  TransactionDataObject,
  TransactionHeaderSection,
  TransactionSection,
  TransactionTableSection,
} from '../../types';

export const extractIsinFromIcon = (icon: string): string => {
  const parts = icon.split('/');
  if (parts.length < 2) {
    throw new Error(`Invalid icon format: ${icon}`);
  }
  return parts[1];
};

export const extractDate = (timestamp: string): string =>
  timestamp.slice(0, 10);

export const getDetailText = (
  subsection: TransactionDataObject | undefined,
): string | undefined => {
  return subsection?.detail?.displayValue?.text ?? subsection?.detail?.text;
};

export const findSubsection = (
  tableSection: TransactionTableSection,
  title: string,
) => {
  return tableSection.data.find((subSection) => subSection.title === title);
};

export const findTableSection = (
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

export const findHeaderSection = (
  sections: TransactionSection[] | undefined,
): TransactionHeaderSection | undefined => {
  return sections?.find(
    (section): section is TransactionHeaderSection =>
      'title' in section && section.type === 'header',
  );
};

export const extractIsinFromHeader = (
  sections: TransactionSection[] | undefined,
): string => {
  const headerSection = findHeaderSection(sections);
  if (!headerSection?.data?.icon) {
    throw new Error('Missing icon in header section');
  }
  return extractIsinFromIcon(headerSection.data.icon);
};

export const identifyBuyOrSell = (
  transaction: Transaction,
): TRANSACTION_TYPE.BUY | TRANSACTION_TYPE.SELL => {
  if (
    transaction.subtitle === 'Buy Order' ||
    transaction.subtitle === 'Limit Buy' ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.SAVINGS_PLAN ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.ROUNDUP ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.CASHBACK ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.WELCOME_STOCK_GIFT ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.RECEIVED_GIFT ||
    transaction.eventType === TRANSACTION_EVENT_TYPE.GIVE_AWAY_GIFT
  ) {
    return TRANSACTION_TYPE.BUY;
  }
  // Sell and Limit Sell
  return TRANSACTION_TYPE.SELL;
};

export const parseToBigNumber = (value: string | undefined): BigNumber => {
  if (!value) return new BigNumber(0);

  // Extract all digits, commas, and dots
  const numericMatch = value.match(/[\d.,]+/);

  if (!numericMatch) {
    return new BigNumber(0);
  }

  // Remove all commas (thousands separators) and keep dots (decimal separators)
  const sanitizedValue = numericMatch[0].replace(/,/g, '');

  return new BigNumber(sanitizedValue);
};
