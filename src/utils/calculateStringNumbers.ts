export const calculateStringNumbers = (
  operation: 'add' | 'subtract' | 'multiply' | 'divide',
  stringNumbers: (string | undefined)[],
): string => {
  let total = Number(stringNumbers?.[0]);
  if (!stringNumbers || stringNumbers.length < 2 || isNaN(total)) return '';

  for (const stringNumber of stringNumbers.slice(1)) {
    const number = Number(stringNumber);
    if (isNaN(number)) return '';
    if (operation === 'add') total += number;
    if (operation === 'subtract') total += number;
    if (operation === 'multiply') total *= number;
    if (operation === 'divide') total /= number;
  }

  return total.toFixed(2);
};
