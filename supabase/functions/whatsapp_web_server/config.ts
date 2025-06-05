
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const VPS_CONFIG = {
  baseUrl: Deno.env.get('VPS_BASE_URL') || 'http://194.163.175.226:3003',
  apiToken: Deno.env.get('VPS_API_TOKEN') || '',
  timeout: 30000
};

export function getVPSHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VPS_CONFIG.apiToken}`,
    'X-API-Key': VPS_CONFIG.apiToken
  };
}

export function isRealQRCode(qrCode: string): boolean {
  if (!qrCode || typeof qrCode !== 'string') {
    return false;
  }
  
  // QR Code real deve ter pelo menos 50 caracteres
  if (qrCode.length < 50) {
    return false;
  }
  
  // QR Code real geralmente começa com padrões específicos
  const validPrefixes = ['data:image/', 'iVBORw0KGgo', '/9j/', 'R0lGOD'];
  const hasValidPrefix = validPrefixes.some(prefix => qrCode.startsWith(prefix));
  
  if (hasValidPrefix) {
    return true;
  }
  
  // Verificar se contém caracteres típicos de QR Code do WhatsApp
  const hasWhatsAppPattern = qrCode.includes('@') || qrCode.includes('whatsapp') || qrCode.length > 100;
  
  return hasWhatsAppPattern;
}
