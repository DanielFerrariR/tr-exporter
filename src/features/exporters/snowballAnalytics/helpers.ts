import axios from 'axios';
import { parse } from 'node-html-parser';

// Cache for the exchange for a given isin
const isinToExchange: Record<string, string> = {};

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
    return 'XETRA';
  }

  isinToExchange[isin] = 'F';
  return 'F';
};
