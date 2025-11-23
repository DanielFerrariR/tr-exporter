import { EMPTY_STRING } from './constants';

export const escapeCsvField = (field: string): string => {
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
};

export const createCsvRow = (fields: string[]): string => {
  return fields.map((field) => escapeCsvField(field ?? EMPTY_STRING)).join(',');
};

// Transaction type handlers
export interface CsvRowData {
  event: string;
  date: string;
  symbol: string;
  price: string;
  quantity: string;
  currency: string;
  feeTax: string;
  exchange: string;
  feeCurrency: string;
  doNotAdjustCash: string;
  note: string;
}

export const isRowEmpty = (row: CsvRowData): boolean => {
  return Object.values(row).every((field) => !field);
};
