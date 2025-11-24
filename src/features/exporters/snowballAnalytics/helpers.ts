import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { parse } from 'node-html-parser';
import { saveFile } from '@/utils/saveFile';

// Cache for the exchange for a given isin
const isinToExchange: Record<string, string> = {};

const CACHE_FILE_PATH = path.join(
  process.cwd(),
  'build',
  'isinToExchange.json',
);

// Load cache from file if it exists
const loadCache = (): void => {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const cacheData = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
      const loadedCache = JSON.parse(cacheData);
      Object.assign(isinToExchange, loadedCache);
    }
  } catch (error) {
    console.warn(
      `Failed to load ISIN cache from ${CACHE_FILE_PATH}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
};

// Save cache to file
const saveCache = (): void => {
  saveFile(
    JSON.stringify(isinToExchange, null, 2),
    'isinToExchange.json',
    'build',
    true,
  );
};

// Load cache on module initialization
loadCache();

// Get the exchange for a given isin
// Needed for the case the portfolio tracker doesn't support Lang & Schwarz exchange
// Using Xetra as the default and if the stock/etf isn't tradable in Xetra it will fallback to Frankfurt
export const getExchangeFromIsin = async (isin: string) => {
  if (isinToExchange[isin]) return isinToExchange[isin];

  // We don't know if its a etf or stock yet with just the isin, so we need to check both
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
    isinToExchange[isin] = 'XETRA';
    saveCache();
    return 'XETRA';
  }

  isinToExchange[isin] = 'F';
  saveCache();
  return 'F';
};
