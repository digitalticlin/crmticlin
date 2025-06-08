
// CORREÇÃO COMPLETA: Configuração VPS atualizada com endpoints corretos

export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  timeout: 25000,
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  
  endpoints: {
    health: '/health',
    instances: '/instances',
    createInstance: '/instance/create',
    deleteInstance: '/instance/delete',
    // CORREÇÃO: Endpoint QR correto baseado na análise
    getQRDirect: '/instance/{instanceId}/qr', // GET - FUNCIONA
    getStatus: '/instance/{instanceId}/status', // GET - FUNCIONA
    sendMessage: '/send' // POST - FUNCIONA
  },
  
  webhook: {
    // CORREÇÃO: VPS usa webhook global já configurado
    globalUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
    isConfigured: true,
    supportsIndividual: false // VPS não suporta webhook individual
  }
};

// CORREÇÃO: Headers que funcionam na VPS
export function getVPSHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
    'X-API-Token': VPS_CONFIG.authToken,
    'User-Agent': 'Supabase-WhatsApp-VPS-Client/3.0-CORRECTED',
    'Accept': 'application/json'
  };
}

// CORREÇÃO: Construir URLs com parâmetros
export function buildVPSUrl(endpoint: string, params?: Record<string, string>): string {
  let url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, value);
    });
  }
  
  return url;
}

// CORREÇÃO: Validação de QR Code melhorada
export function isRealQRCode(qrCode: string): boolean {
  if (!qrCode || typeof qrCode !== 'string') return false;
  
  // QR Code deve ter tamanho mínimo
  if (qrCode.length < 50) return false;
  
  // Verificar padrões válidos
  const validPatterns = [
    qrCode.startsWith('data:image/'), // Data URL
    qrCode.includes('whatsapp'), // Contém whatsapp
    /^[A-Za-z0-9+/]+=*$/.test(qrCode) && qrCode.length > 100 // Base64 válido
  ];
  
  return validPatterns.some(pattern => pattern);
}

// CORREÇÃO: Normalização de QR Code
export function normalizeQRCode(qrCode: string): string {
  if (!qrCode) return '';
  
  // Se já é data URL, retornar
  if (qrCode.startsWith('data:image/')) {
    return qrCode;
  }
  
  // Se é base64, converter para data URL
  if (/^[A-Za-z0-9+/]+=*$/.test(qrCode)) {
    return `data:image/png;base64,${qrCode}`;
  }
  
  return qrCode;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
