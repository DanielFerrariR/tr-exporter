// In-memory storage for phone number
let phoneNumber: string | null = null;

export const getPhoneNumber = (): string | null => {
  return phoneNumber;
};

export const setPhoneNumber = (newPhoneNumber: string): void => {
  phoneNumber = newPhoneNumber;
};

export const hasPhoneNumber = (): boolean => {
  return phoneNumber !== null;
};
