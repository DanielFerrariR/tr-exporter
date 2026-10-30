export enum ACCOUNT_LOCALE {
  EN = 'en',
  PT = 'pt',
}

export type SupportedLocale = `${ACCOUNT_LOCALE}`;

export type TimelineLabelEntry = string | string[];

export interface ObservedTimelineDictionary {
  sections: {
    transaction: TimelineLabelEntry;
    overview: TimelineLabelEntry;
  };
  subsections: {
    shares: TimelineLabelEntry;
    sharePrice: TimelineLabelEntry;
    sharesAdded: TimelineLabelEntry;
    sharesRemoved: TimelineLabelEntry;
    creditedShares: TimelineLabelEntry;
    debitedShares: TimelineLabelEntry;
    tax: TimelineLabelEntry;
    taxCorrection: TimelineLabelEntry;
    fee: TimelineLabelEntry;
    total: TimelineLabelEntry;
  };
}

/**
 * Observed label dictionaries extracted directly from actual Trade Republic payload files.
 * Only locales and keywords that have been verified in test account data are included here.
 * (German accounts return English payloads because the API client requests locale: 'en').
 */
export const OBSERVED_TIMELINE_DICTIONARIES: Record<
  SupportedLocale,
  ObservedTimelineDictionary
> = {
  // Observed across German accounts (+49...) and English transactions in PT account (+351...)
  [ACCOUNT_LOCALE.EN]: {
    sections: {
      transaction: 'Transaction',
      overview: 'Overview',
    },
    subsections: {
      shares: 'Shares',
      sharePrice: 'Share price',
      sharesAdded: 'Shares added',
      sharesRemoved: 'Shares removed',
      creditedShares: 'Credited Shares',
      debitedShares: 'Debited Shares',
      tax: 'Tax',
      taxCorrection: 'Tax Correction',
      fee: 'Fee',
      total: 'Total',
    },
  },
  // Observed in Portuguese account (+351...) for server-rendered tax and corporate action items
  [ACCOUNT_LOCALE.PT]: {
    sections: {
      transaction: 'Transação',
      overview: 'Resumo',
    },
    subsections: {
      shares: 'Ações',
      sharePrice: 'Preço por ação',
      sharesAdded: 'Ações adicionadas',
      sharesRemoved: 'Ações removidas',
      creditedShares: 'Ações creditadas',
      debitedShares: 'Ações debitadas',
      tax: 'Imposto',
      taxCorrection: 'Correção fiscal',
      fee: 'Comissão',
      total: 'Total',
    },
  },
};

export const getSupportedLocales = (): SupportedLocale[] =>
  Object.keys(OBSERVED_TIMELINE_DICTIONARIES) as SupportedLocale[];

export const isLocaleSupported = (locale: string): boolean =>
  getSupportedLocales().includes(locale as SupportedLocale);

/**
 * Returns all observed variants for a given field across supported account locales.
 */
export const getTimelineLabels = (
  selector: (dict: ObservedTimelineDictionary) => TimelineLabelEntry,
): string[] => {
  const result = new Set<string>();
  for (const dict of Object.values(OBSERVED_TIMELINE_DICTIONARIES)) {
    const entry = selector(dict);
    if (Array.isArray(entry)) {
      entry.forEach((val) => result.add(val));
    } else {
      result.add(entry);
    }
  }
  return Array.from(result);
};
