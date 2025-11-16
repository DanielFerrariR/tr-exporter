import { PDFParse } from 'pdf-parse';
import BigNumber from 'bignumber.js';

export interface TransactionPdfData {
  shares: string;
  dividendPerShare: string;
  currency: string;
  taxAmount: string;
  taxCurrency: string;
  dividendTotal: string;
}

export const parseTransactionDividendPdf = async (
  data: Buffer,
): Promise<TransactionPdfData> => {
  try {
    const parser = new PDFParse({ data });
    const pdfData = await parser.getText();
    const text = pdfData.text;

    // Extract shares and dividend per share from POSITION line
    // Pattern: "SYMBOL\nISIN SHARES Stücke DIVIDEND_PER_SHARE CURRENCY TOTAL CURRENCY"
    // Example: "Realty Income\nUS7561091049 78.897459 Stücke 0.2695 USD 21.26 USD"
    const positionMatch = text.match(
      /([A-Z0-9]{12})\s+([\d.,]+)\s+Stücke\s+([\d.,]+)\s+([A-Z]{3})\s+([\d.,]+)\s+([A-Z]{3})/,
    );

    // Extract tax from "Quellensteuer" line
    // Pattern: "Quellensteuer für US-Emittenten -AMOUNT CURRENCY"
    const taxMatch = text.match(/Quellensteuer.*?-([\d.,]+)\s+([A-Z]{3})/);

    let shares: string = '';
    let dividendPerShare: string = '';
    let currency: string = '';
    let taxAmount: string = '';
    let taxCurrency: string = '';
    let dividendTotal: string = '';

    if (positionMatch) {
      shares = new BigNumber(positionMatch[2].replace(',', '.')).toFixed();
      dividendPerShare = new BigNumber(
        positionMatch[3].replace(',', '.'),
      ).toFixed();
      currency = positionMatch[4];
      dividendTotal = new BigNumber(
        positionMatch[5].replace(',', '.'),
      ).toFixed();
    } else {
      console.error('Could not extract position data from PDF');
    }

    if (taxMatch) {
      taxAmount = new BigNumber(taxMatch[1].replace(',', '.')).toFixed();
      taxCurrency = taxMatch[2];
    }

    return {
      shares,
      dividendPerShare,
      currency,
      taxAmount,
      taxCurrency,
      dividendTotal,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return {
      shares: '',
      dividendPerShare: '',
      currency: '',
      taxAmount: '',
      taxCurrency: '',
      dividendTotal: '',
    };
  }
};
