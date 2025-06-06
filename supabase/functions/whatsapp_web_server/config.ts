
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: 'default-token',
  timeout: 30000,
  endpoints: {
    health: '/health',
    instances: '/instances',
    createInstance: '/instance/create',
    deleteInstance: '/instance/delete',
    sendMessage: '/send',
    getQRDirect: '/instance/{instanceId}/qr',
    configureWebhook: '/instance/{instanceId}/webhook',
    restart: '/instance/restart',
    getStatus: '/instance/{instanceId}/status'
  }
} as const;

export function getVPSHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
    'Accept': 'application/json',
    'User-Agent': 'Supabase-Edge-Function/1.0'
  };
}

export function isRealQRCode(qrCode: string): boolean {
  if (!qrCode || typeof qrCode !== 'string') {
    return false;
  }

  // QR Code deve ter um tamanho mínimo
  if (qrCode.length < 50) {
    return false;
  }

  // Verificar se é base64 válido
  const isBase64 = /^data:image\/[a-zA-Z]+;base64,/.test(qrCode);
  
  // Verificar se não é mensagem de erro
  const isNotError = !qrCode.toLowerCase().includes('error') && 
                     !qrCode.toLowerCase().includes('waiting') &&
                     !qrCode.toLowerCase().includes('generating');
  
  return isBase64 && isNotError;
}

export function normalizeQRCode(qrCode: string): string {
  if (!qrCode) return '';
  
  // Se já é base64, retornar como está
  if (qrCode.startsWith('data:image/')) {
    return qrCode;
  }
  
  // Se é só o base64 sem header, adicionar
  if (qrCode.match(/^[A-Za-z0-9+/=]+$/)) {
    return `data:image/png;base64,${qrCode}`;
  }
  
  return qrCode;
}
