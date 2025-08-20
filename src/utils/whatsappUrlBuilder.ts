export const buildWhatsAppChatUrl = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  const formattedPhone = cleanPhone.startsWith('55') 
    ? cleanPhone 
    : `55${cleanPhone}`;
  
  return `/whatsapp-chat?phone=${formattedPhone}`;
};

export const formatPhoneForWhatsApp = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  return cleanPhone.startsWith('55') 
    ? cleanPhone 
    : `55${cleanPhone}`;
};