import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { parse } from 'node-html-parser';
import { saveFile } from '@/utils/saveFile';
import { getPhoneNumber } from '@/utils/phoneNumberStorage';

export interface IsinRemap {
  isin: string;
  currency: string;
  exchange: string;
}

// Cache for ISIN remapping
const remapIsins: Record<string, IsinRemap> = {};
let cacheLoaded = false;

// Get cache file path based on phone number
const getCacheFilePath = (): string | null => {
  const phoneNumber = getPhoneNumber();
  if (!phoneNumber) {
    return null;
  }
  return path.join(process.cwd(), 'build', phoneNumber, 'remapIsins.json');
};

// Load cache from file if it exists
// Returns true if cache was successfully loaded (or attempted to load), false otherwise
const loadCache = (): boolean => {
  const cacheFilePath = getCacheFilePath();
  if (!cacheFilePath) {
    return false;
  }

  try {
    if (fs.existsSync(cacheFilePath)) {
      const cacheData = fs.readFileSync(cacheFilePath, 'utf8');
      const loadedCache = JSON.parse(cacheData);
      Object.assign(remapIsins, loadedCache);
    }
    return true;
  } catch (error) {
    console.warn(
      `Failed to load ISIN remap cache from ${cacheFilePath}:`,
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
};

// Save cache to file
const saveCache = (): void => {
  const phoneNumber = getPhoneNumber();
  if (!phoneNumber) {
    return;
  }

  saveFile(
    JSON.stringify(remapIsins, null, 2),
    'remapIsins.json',
    `build/${phoneNumber}`,
    true,
  );
};

// Export function to reload cache (useful when remapIsins.json is updated)
export const reloadRemapIsinsCache = (): void => {
  // Clear existing cache
  Object.keys(remapIsins).forEach((key) => delete remapIsins[key]);
  cacheLoaded = false;
  // Reload from file - only set cacheLoaded to true if cache was actually loaded
  cacheLoaded = loadCache();
};

// Get the remap data for a given isin
// If the ISIN is not in the remap, it will be added with default values:
// - isin: the ISIN itself
// - currency: EUR
// - exchange: XETRA if available, otherwise F
export const getRemapFromIsin = async (isin: string): Promise<IsinRemap> => {
  // Load cache if not already loaded
  if (!cacheLoaded) {
    cacheLoaded = loadCache();
  }

  // If already in cache, return it
  if (remapIsins[isin]) {
    return remapIsins[isin];
  }

  // Determine exchange (try to get Xetra, fallback to F)
  let exchange = 'F';

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
    exchange = 'XETRA';
  }

  // Create remap entry with defaults
  const remap: IsinRemap = {
    isin,
    currency: 'EUR',
    exchange,
  };

  // Add to cache and save
  remapIsins[isin] = remap;
  saveCache();

  return remap;
};
