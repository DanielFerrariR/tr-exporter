import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { parse } from 'node-html-parser';
import { consola } from 'consola';
import {
  DividendTransaction,
  CashTransaction,
  OrderTransaction,
  Portfolio,
  CorporateActionTransaction,
  TRANSACTION_TYPE,
} from '@/domain/portfolio';
import { TRANSACTION_EVENT_TYPE } from '@/domain/constants';
import { parseToBigNumber } from '@/domain/portfolio/parseToBigNumber';

const OUTPUT_DIRECTORY = 'build';
const FILE_NAME = 'snowballTransactions.csv';
const DISABLED_PRICE_FOR_CASH_GAIN_AND_EXPENSES = '1';
const DISABLED_PRICE_FOR_SPLIT = '1';
const DISABLED_PRICE_FOR_STOCK_AS_DIVIDEND = '0';
const DEFAULT_CURRENCY = 'EUR';

const EVENT_TYPE_DIVIDEND = 'Dividend';
const EVENT_TYPE_BUY = 'Buy';
const EVENT_TYPE_SELL = 'Sell';
const EVENT_TYPE_CASH_GAIN = 'Cash_Gain';
const EVENT_TYPE_CASH_EXPENSE = 'Cash_Expense';
const EVENT_TYPE_SPLIT = 'Split';
const EVENT_TYPE_STOCK_AS_DIVIDEND = 'Stock_As_Dividend';

const TYPE_MAP = {
  [TRANSACTION_TYPE.BUY]: EVENT_TYPE_BUY,
  [TRANSACTION_TYPE.SELL]: EVENT_TYPE_SELL,
  [TRANSACTION_TYPE.CASH_GAIN]: EVENT_TYPE_CASH_GAIN,
  [TRANSACTION_TYPE.CASH_EXPENSE]: EVENT_TYPE_CASH_EXPENSE,
};

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
] as const;

interface IsinRemap {
  isin: string;
  currency: string;
  exchange: string;
}

interface CsvRowData {
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

class SnowballAnalyticsExporter {
  private readonly remapIsins: Record<string, IsinRemap> = {};

  constructor(private readonly phoneNumber: string) {
    this.loadCache();
  }

  private getCacheFilePath(): string {
    return path.join(
      process.cwd(),
      'build',
      this.phoneNumber,
      'remapIsins.json',
    );
  }

  private loadCache(): void {
    const cacheFilePath = this.getCacheFilePath();
    try {
      if (fs.existsSync(cacheFilePath)) {
        Object.assign(
          this.remapIsins,
          JSON.parse(fs.readFileSync(cacheFilePath, 'utf8')),
        );
      }
    } catch (error) {
      consola.warn(
        `Failed to load ISIN remap cache from ${cacheFilePath}:`,
        error,
      );
    }
  }

  private saveCache(): void {
    const filePath = this.getCacheFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(this.remapIsins, null, 2));
  }

  private async getRemapFromIsin(isin: string): Promise<IsinRemap> {
    if (this.remapIsins[isin]) {
      return this.remapIsins[isin];
    }

    let exchange = 'F';

    const [stockResponse, etfResponse] = await Promise.allSettled([
      axios.get(`https://www.boerse-frankfurt.de/aktie/${isin}`),
      axios.get(`https://www.boerse-frankfurt.de/etf/${isin}`),
    ]);

    const stockData =
      stockResponse.status === 'fulfilled' ? stockResponse.value.data : null;
    const etfData =
      etfResponse.status === 'fulfilled' ? etfResponse.value.data : null;

    const stockExchanges = stockData
      ? parse(stockData).getElementsByTagName('app-widget-exchange-bar')?.[0]
          ?.children
      : null;
    const etfExchanges = etfData
      ? parse(etfData).getElementsByTagName('app-widget-exchange-bar')?.[0]
          ?.children
      : null;

    if (
      stockExchanges?.some((item) => item?.innerText.includes('Xetra')) ||
      etfExchanges?.some((item) => item?.innerText.includes('Xetra'))
    ) {
      exchange = 'XETRA';
    }

    const remap: IsinRemap = { isin, currency: 'EUR', exchange };
    this.remapIsins[isin] = remap;
    this.saveCache();

    return remap;
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private createCsvRow(fields: string[]): string {
    return fields.map((field) => this.escapeCsvField(field ?? '')).join(',');
  }

  private isRowEmpty(row: CsvRowData): boolean {
    return Object.values(row).every((field) => !field);
  }

  private async handleDividend(item: DividendTransaction): Promise<CsvRowData> {
    const { exchange, isin, currency } = await this.getRemapFromIsin(item.isin);
    return {
      event: EVENT_TYPE_DIVIDEND,
      date: item.date,
      symbol: isin,
      exchange,
      note: item.title,
      quantity: item.dividendTotal,
      price: item.dividendPerShare,
      currency,
      feeTax: item.tax,
      feeCurrency: currency,
      doNotAdjustCash: '',
    };
  }

  private async handleOrderTransaction(
    item: OrderTransaction,
  ): Promise<CsvRowData[]> {
    const { exchange, isin, currency } = await this.getRemapFromIsin(item.isin);

    const rows: CsvRowData[] = [
      {
        event: TYPE_MAP[item.type],
        date: item.date,
        symbol: isin,
        exchange,
        note: item.title,
        quantity: item.quantity,
        price: item.price,
        currency,
        feeTax: item.fee,
        feeCurrency: currency,
        doNotAdjustCash: '',
      },
    ];

    if (item.tax && parseToBigNumber(item.tax).isGreaterThan(0)) {
      rows.push({
        event: EVENT_TYPE_CASH_EXPENSE,
        date: item.date,
        symbol: '',
        exchange: '',
        note: `${item.title} - Tax`,
        quantity: item.tax,
        price: DISABLED_PRICE_FOR_CASH_GAIN_AND_EXPENSES,
        currency,
        feeTax: '',
        feeCurrency: '',
        doNotAdjustCash: '',
      });
    }

    if (
      item.taxCorrection &&
      parseToBigNumber(item.taxCorrection).isGreaterThan(0)
    ) {
      rows.push({
        event: EVENT_TYPE_CASH_GAIN,
        date: item.date,
        symbol: '',
        exchange: '',
        note: `${item.title} - Tax Correction`,
        quantity: item.taxCorrection,
        price: DISABLED_PRICE_FOR_CASH_GAIN_AND_EXPENSES,
        currency,
        feeTax: '',
        feeCurrency: '',
        doNotAdjustCash: '',
      });
    }

    return rows;
  }

  private handleCashTransaction(item: CashTransaction): CsvRowData {
    return {
      event: TYPE_MAP[item.type],
      date: item.date,
      symbol: '',
      exchange: '',
      note: item.title,
      quantity: item.amount,
      price: DISABLED_PRICE_FOR_CASH_GAIN_AND_EXPENSES,
      currency: DEFAULT_CURRENCY,
      feeTax: item.tax,
      feeCurrency: DEFAULT_CURRENCY,
      doNotAdjustCash: '',
    };
  }

  private async handleCorporateActionTransaction(
    item: CorporateActionTransaction,
  ): Promise<CsvRowData> {
    const { isin, currency } = await this.getRemapFromIsin(item.isin);

    if (
      parseToBigNumber(item.debitedShares).isGreaterThan(0) &&
      parseToBigNumber(item.creditedShares).isGreaterThan(0)
    ) {
      return {
        event: EVENT_TYPE_SPLIT,
        date: item.date,
        symbol: isin,
        exchange: '',
        note: item.title,
        quantity: DISABLED_PRICE_FOR_SPLIT,
        price: parseToBigNumber(item.creditedShares)
          .dividedBy(parseToBigNumber(item.debitedShares))
          .toFixed(),
        currency,
        feeTax: '',
        feeCurrency: '',
        doNotAdjustCash: '',
      };
    }

    return {
      event: EVENT_TYPE_STOCK_AS_DIVIDEND,
      date: item.date,
      symbol: isin,
      exchange: '',
      note: item.title,
      quantity: item.creditedShares,
      price: DISABLED_PRICE_FOR_STOCK_AS_DIVIDEND,
      currency,
      feeTax: '',
      feeCurrency: '',
      doNotAdjustCash: '',
    };
  }

  private async convertItemToCsvRow(
    item: Portfolio[0],
  ): Promise<CsvRowData[] | null> {
    try {
      if (item.eventType === TRANSACTION_EVENT_TYPE.DIVIDEND) {
        return [await this.handleDividend(item)];
      }

      if (
        item.eventType === TRANSACTION_EVENT_TYPE.TRADE ||
        item.eventType === TRANSACTION_EVENT_TYPE.SAVINGS_PLAN ||
        item.eventType === TRANSACTION_EVENT_TYPE.ROUNDUP ||
        item.eventType === TRANSACTION_EVENT_TYPE.CASHBACK ||
        item.eventType === TRANSACTION_EVENT_TYPE.WELCOME_STOCK_GIFT ||
        item.eventType === TRANSACTION_EVENT_TYPE.RECEIVED_GIFT ||
        item.eventType === TRANSACTION_EVENT_TYPE.GIVE_AWAY_GIFT
      ) {
        return await this.handleOrderTransaction(item);
      }

      if (
        item.eventType === TRANSACTION_EVENT_TYPE.INTEREST ||
        item.eventType === TRANSACTION_EVENT_TYPE.TAX_CORRECTION
      ) {
        return [this.handleCashTransaction(item)];
      }

      if (item.eventType === TRANSACTION_EVENT_TYPE.CORPORATE_ACTION) {
        return [await this.handleCorporateActionTransaction(item)];
      }

      return null;
    } catch (error) {
      consola.error(
        `Error converting transaction ${item.title} to CSV row:`,
        error,
      );
      return null;
    }
  }

  async convert(data: Portfolio): Promise<void> {
    if (!data?.length) {
      consola.warn(
        'No data provided to convert to CSV. No file will be created.',
      );
      return;
    }

    consola.info('Converting transactions to Snowball CSV format...');

    const csvRowResults = await Promise.all(
      data.map((item) => this.convertItemToCsvRow(item)),
    );

    const csvRows: string[] = [HEADERS.join(',')];
    for (const rowArray of csvRowResults) {
      if (rowArray) {
        for (const row of rowArray) {
          if (row && !this.isRowEmpty(row)) {
            csvRows.push(
              this.createCsvRow([
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
              ]),
            );
          }
        }
      }
    }

    const filePath = path.join(
      process.cwd(),
      OUTPUT_DIRECTORY,
      this.phoneNumber,
      FILE_NAME,
    );
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, csvRows.join('\n'));
    consola.info(`File "${FILE_NAME}" successfully saved to ${filePath}.`);
  }
}

export const convertTransactionsToSnowballCsv = (
  data: Portfolio,
  phoneNumber: string,
): Promise<void> => new SnowballAnalyticsExporter(phoneNumber).convert(data);
