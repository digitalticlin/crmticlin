
export const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove @c.us, @s.whatsapp.net e outros sufixos do WhatsApp
  return phone
    .replace(/@c\.us$/, '')
    .replace(/@s\.whatsapp\.net$/, '')
    .replace(/@g\.us$/, '') // grupos
    .replace(/\D/g, ''); // remove todos os caracteres não numéricos restantes
};

export const formatPhoneForWhatsApp = (phone: string): string => {
  // Primeiro limpa o telefone
  const cleanPhone = cleanPhoneNumber(phone);
  
  // Se já está no formato @c.us, retorna como está
  if (phone.includes('@c.us')) {
    return phone;
  }
  
  // Remove o código do país se for brasileiro (55)
  let formattedNumber = cleanPhone;
  
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
  // Primeiro limpa o telefone
  const cleanPhone = cleanPhoneNumber(phone);
  
  // Formata para exibição: +55 (11) 99999-9999
  if (cleanPhone.length >= 11) {
    const countryCode = cleanPhone.substring(0, 2);
    const areaCode = cleanPhone.substring(2, 4);
    const firstPart = cleanPhone.substring(4, 9);
    const secondPart = cleanPhone.substring(9);
    
    return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
  }
  
  // Se for menor que 11 dígitos, retorna o número limpo
  return cleanPhone;
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = cleanPhoneNumber(phone);
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
};
