import {
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
