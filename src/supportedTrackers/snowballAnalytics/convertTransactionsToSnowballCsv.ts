import { PortfolioData, PortfolioEventType } from '../../types';
import { saveFile } from '../../utils/saveFile';
import { getExchangeFromSymbol } from './symbolToExchange';

const OUTPUT_DIRECTORY = 'build';
const FILE_NAME = 'snowball_transactions.csv';

const HEADERS = [
  'Event',
  'Date',
  'Symbol',
  'Price',
  'Quantity',
  'Currency',
  'FeeTax',
  'Exchange',
  'FeeCurrency',
  'DoNotAdjustCash',
  'Note',
];

export const convertTransactionsToSnowballCsv = async (
  data: PortfolioData,
): Promise<void> => {
  if (!data?.length) {
    console.warn(
      'No data provided to convert to CSV. No file will be created.',
    );
    return;
  }

  let csvRows: string[] = [];
  csvRows.push(HEADERS.join(','));

  console.log('Converting transactions to Snowball CSV format...');

  for (const item of data) {
    let event = '';
    let date = '';
    let symbol = '';
    let price = '';
    let quantity = '';
    let currency = '';
    let feeTax = '';
    let exchange = '';
    let feeCurrency = '';
    let doNotAdjustCash = '';
    let note = '';

    // Dividends
    if (item.eventType === PortfolioEventType.Dividend) {
      event = item.eventType;
      date = item.date;
      symbol = item.isin;
      exchange = await getExchangeFromSymbol(item.isin);
      note = item.title;
      quantity = item.dividendTotal;
      price = item.dividendPerShare;
      currency = item.currency;
      feeTax = item.feeTax;
      feeCurrency = item.feeCurrency;
    }

    // Buy and Sell transactions
    else if (
      item.eventType === PortfolioEventType.Buy ||
      item.eventType === PortfolioEventType.Sell ||
      item.eventType === PortfolioEventType.LimitBuy ||
      item.eventType === PortfolioEventType.LimitSell
    ) {
      event = item.eventType;
      date = item.date;
      symbol = item.isin;
      exchange = await getExchangeFromSymbol(symbol);
      note = item.title;
      quantity = item.quantity;
      price = item.price;
      currency = item.currency;
      feeTax = item.feeTax;
      feeCurrency = item.feeCurrency;
    }

    // Cash Gain and Cash Expense
    else if (
      item.eventType === PortfolioEventType.CashGain ||
      item.eventType === PortfolioEventType.CashExpense
    ) {
      event = item.eventType;
      date = item.date;
      symbol = ''; // Cash transactions don't have ISIN
      exchange = ''; // Cash transactions don't have exchange
      note = item.title;
      quantity = item.amount; // Cash transactions use amount, not quantity
      price = '1';
      currency = item.currency;
      feeTax = item.feeTax;
      feeCurrency = item.feeCurrency;
    }

    const row = [
      event,
      date,
      symbol,
      price,
      quantity,
      currency,
      feeTax,
      exchange,
      feeCurrency,
      doNotAdjustCash,
      note,
    ];

    if (row.every((field) => !field)) continue;

    csvRows.push(row.map((field) => `"${field ?? ''}"`).join(','));
  }

  const csvString = csvRows.join('\n');
  saveFile(csvString, FILE_NAME, OUTPUT_DIRECTORY);
};
