import { PortfolioData } from '../types';
import { convertTransactionsToSnowballCsv } from './snowballAnalytics';

export interface Exporter {
  id: string;
  name: string;
  convert: (data: PortfolioData, accountNumber: string) => Promise<void>;
}

// Registry of all available exporters
export const EXPORTERS: Exporter[] = [
  {
    id: 'snowball',
    name: 'Snowball Analytics',
    convert: convertTransactionsToSnowballCsv,
  },
  // Add more exporters here as they become available
];

export const getExporterById = (id: string): Exporter | undefined => {
  return EXPORTERS.find((exporter) => exporter.id === id);
};
