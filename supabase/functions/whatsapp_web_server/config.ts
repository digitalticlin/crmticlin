
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  apiToken: Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 30000,
  retries: 3
};

export function getVPSHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VPS_CONFIG.apiToken}`,
    'X-API-Key': VPS_CONFIG.apiToken,
    'Accept': 'application/json'
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

export async function testVPSConnection(): Promise<boolean> {
  try {
    console.log('[VPS Test] 🔗 Testando conexão com VPS...');
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      console.log('[VPS Test] ✅ Conexão VPS bem-sucedida');
      return true;
    } else {
      console.error('[VPS Test] ❌ Falha na conexão VPS:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[VPS Test] ❌ Erro ao testar VPS:', error);
    return false;
  }
}
