export const CURRENCIES = [
  { value: 'BRL', label: 'Real Brasileiro', symbol: 'R$', locale: 'pt-BR' },
  { value: 'USD', label: 'Dólar Americano', symbol: '$', locale: 'en-US' },
  { value: 'EUR', label: 'Euro', symbol: '€', locale: 'de-DE' },
  { value: 'GBP', label: 'Libra Esterlina', symbol: '£', locale: 'en-GB' },
  { value: 'JPY', label: 'Iene Japonês', symbol: '¥', locale: 'ja-JP' },
  { value: 'CHF', label: 'Franco Suíço', symbol: 'Fr', locale: 'de-CH' },
  { value: 'CAD', label: 'Dólar Canadense', symbol: 'C$', locale: 'en-CA' },
  { value: 'AUD', label: 'Dólar Australiano', symbol: 'A$', locale: 'en-AU' }
];

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.value === currencyCode);
  return currency?.symbol || currencyCode;
};

export const formatCurrency = (value: number, currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.value === currencyCode);
  if (!currency) return `${currencyCode} ${value}`;

  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${currency.symbol} ${value.toFixed(2)}`;
  }
};
