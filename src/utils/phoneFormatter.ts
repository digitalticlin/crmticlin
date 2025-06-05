
export const formatPhoneForWhatsApp = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const numbersOnly = phone.replace(/\D/g, '');
  
  // Se já está no formato @c.us, retorna como está
  if (phone.includes('@c.us')) {
    return phone;
  }
  
  // Remove o código do país se for brasileiro (55)
  let formattedNumber = numbersOnly;
  
  // Se começar com 55 e tem mais de 11 dígitos, remove o 55
  if (formattedNumber.startsWith('55') && formattedNumber.length > 11) {
    formattedNumber = formattedNumber.substring(2);
  }
  
  // Se não tem o 9 no celular, adiciona
  if (formattedNumber.length === 10 && !formattedNumber.startsWith('11')) {
    formattedNumber = formattedNumber.substring(0, 2) + '9' + formattedNumber.substring(2);
  }
  
  // Adiciona o código do país brasileiro se não tiver
  if (!formattedNumber.startsWith('55')) {
    formattedNumber = '55' + formattedNumber;
  }
  
  return formattedNumber + '@c.us';
};

export const formatPhoneDisplay = (phone: string): string => {
  // Remove @c.us se existir
  const numbersOnly = phone.replace('@c.us', '').replace(/\D/g, '');
  
  // Formata para exibição: +55 (11) 99999-9999
  if (numbersOnly.length >= 11) {
    const countryCode = numbersOnly.substring(0, 2);
    const areaCode = numbersOnly.substring(2, 4);
    const firstPart = numbersOnly.substring(4, 9);
    const secondPart = numbersOnly.substring(9);
    
    return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
  }
  
  return phone;
};

export const validatePhone = (phone: string): boolean => {
  const numbersOnly = phone.replace(/\D/g, '');
  return numbersOnly.length >= 10 && numbersOnly.length <= 15;
};
