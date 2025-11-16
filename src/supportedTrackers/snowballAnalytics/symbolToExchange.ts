import axios from 'axios';
import { parse } from 'node-html-parser';

const symbolToExchange: Record<string, string> = {};

// Using Xetra as the default as Snowball Analytics doesn't support Lang & Schwarz exchange
// if the stock/etf isn't tradable in Xetra it will fallback to Frankfurt
export const getExchangeFromSymbol = async (symbol: string) => {
  if (symbolToExchange[symbol]) return symbolToExchange[symbol];

  // We don't know if its a etf or stock yet with just the symbol, so we need to check both
  const [stockResponse, etfResponse] = await Promise.allSettled([
    axios.get(`https://www.boerse-frankfurt.de/aktie/${symbol}`),
    axios.get(`https://www.boerse-frankfurt.de/etf/${symbol}`),
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
    symbolToExchange[symbol] = 'XETRA';
    return 'XETRA';
  }

  symbolToExchange[symbol] = 'F';
  return 'F';
};
