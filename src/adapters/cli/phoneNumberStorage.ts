import fs from 'fs';
import path from 'path';

export interface Account {
  phoneNumber: string;
  label?: string;
}

interface AccountsStore {
  lastUsed: string | null;
  accounts: Account[];
}

const STORE_PATH = path.join(process.cwd(), 'build', 'accounts.json');

let currentPhoneNumber: string | null = null;

const loadStore = (): AccountsStore => {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    }
  } catch {
    // ignore corrupt file, start fresh
  }
  return { lastUsed: null, accounts: [] };
};

const saveStore = (store: AccountsStore): void => {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
};

export const getAccounts = (): Account[] => loadStore().accounts;

export const getLastUsedPhoneNumber = (): string | null => loadStore().lastUsed;

export const saveAccount = (phoneNumber: string, label?: string): void => {
  const store = loadStore();
  const existing = store.accounts.find((a) => a.phoneNumber === phoneNumber);
  if (existing) {
    if (label !== undefined) existing.label = label || undefined;
  } else {
    store.accounts.push(label ? { phoneNumber, label } : { phoneNumber });
  }
  store.lastUsed = phoneNumber;
  saveStore(store);
};

export const getPhoneNumber = (): string | null => currentPhoneNumber;

export const setPhoneNumber = (phoneNumber: string): void => {
  currentPhoneNumber = phoneNumber;
};

export const hasPhoneNumber = (): boolean => currentPhoneNumber !== null;
