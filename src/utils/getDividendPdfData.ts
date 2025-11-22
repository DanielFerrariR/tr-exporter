import axios from 'axios';
import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  parseTransactionDividendPdf,
  TransactionPdfData,
} from './parseTransactionDividendPdf';

const DIVIDEND_PDFS_DATA_FILE = join(
  process.cwd(),
  'build',
  'dividendPdfsData.json',
);

/**
 * Generates a unique key for caching PDF data based on the document URL
 */
export const getPdfFilename = (
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
export const loadDividendPdfsData = (): Record<string, TransactionPdfData> => {
  if (!existsSync(DIVIDEND_PDFS_DATA_FILE)) {
    return {};
  }

  try {
    const data = readFileSync(DIVIDEND_PDFS_DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    // Silently return empty object if file doesn't exist or can't be read
    // This is expected on first run and handled gracefully
    return {};
  }
};

/**
 * Saves dividend PDFs data to JSON file
 */
export const saveDividendPdfsData = (
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

/**
 * Gets dividend PDF data, using cache if available, otherwise downloading and parsing the PDF
 * @param documentUrl The URL of the dividend PDF document
 * @param date The transaction date (YYYY-MM-DD format)
 * @param isin The ISIN of the security
 * @param dividendPdfsData The cached PDF data object (will be updated if new data is fetched)
 * @returns The parsed PDF data and a boolean indicating if the cache was updated
 */
export const getDividendPdfData = async (
  documentUrl: string,
  date: string,
  isin: string,
  dividendPdfsData: Record<string, TransactionPdfData>,
): Promise<{ data: TransactionPdfData; cacheUpdated: boolean }> => {
  // Generate filename for the PDF
  const pdfFilename = getPdfFilename(documentUrl, date, isin);

  // Check if we have cached data in JSON
  if (dividendPdfsData[pdfFilename]) {
    // Use cached data from JSON
    return { data: dividendPdfsData[pdfFilename], cacheUpdated: false };
  }

  // Download and parse PDF, then cache the result
  const response = await axios.get(documentUrl, {
    responseType: 'arraybuffer',
  });
  const pdfBuffer = Buffer.from(response.data);

  const parsedPdf = await parseTransactionDividendPdf(pdfBuffer);

  // Cache the parsed data
  dividendPdfsData[pdfFilename] = parsedPdf;

  return { data: parsedPdf, cacheUpdated: true };
};
