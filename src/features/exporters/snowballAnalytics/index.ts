import { PortfolioData } from '@/types';
import { saveFile } from '@/utils/saveFile';
import { FILE_NAME, HEADERS } from './constants';
import { createCsvRow, isRowEmpty } from './utils';
import { convertItemToCsvRow } from './handlers';

export const convertTransactionsToSnowballCsv = async (
  data: PortfolioData,
  accountNumber: string,
): Promise<void> => {
  if (!data?.length) {
    console.warn(
      'No data provided to convert to CSV. No file will be created.',
    );
    return;
  }

  console.log('Converting transactions to Snowball CSV format...');

  // Convert all items to CSV rows in parallel (where possible)
  // Note: getExchangeFromIsin has internal caching, so parallel calls are efficient
  const csvRowPromises = data.map(convertItemToCsvRow);
  const csvRowResults = await Promise.all(csvRowPromises);

  // Filter out null results and empty rows, then convert to CSV format
  const csvRows: string[] = [HEADERS.join(',')];

  for (const row of csvRowResults) {
    if (row && !isRowEmpty(row)) {
      const rowArray = [
        row.event,
        row.date,
        row.symbol,
        row.price,
        row.quantity,
        row.currency,
        row.feeTax,
        row.exchange,
        row.feeCurrency,
        row.doNotAdjustCash,
        row.note,
      ];
      csvRows.push(createCsvRow(rowArray));
    }
  }

  const csvString = csvRows.join('\n');
  saveFile(csvString, FILE_NAME, `build/${accountNumber}`);
};
