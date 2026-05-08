import { selectOrAddAccount } from '@/adapters/cli/accountSelection';

export const handleChangePhoneNumber = async (): Promise<void> => {
  await selectOrAddAccount();
};
