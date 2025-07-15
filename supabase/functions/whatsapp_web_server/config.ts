// CONFIGURAÇÃO PRINCIPAL VPS - ATUALIZADA PARA NOVA VPS
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.163.57:3001',
  authToken: 'bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1',
  timeout: 45000,
  endpoints: {
    createInstance: '/instance/create',
    deleteInstance: '/instance/delete',
    listInstances: '/instances',
    sendMessage: '/send',
    getQR: '/instance/qr',
    getStatus: '/instance/status',
    health: '/health'
  }
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export function getVPSHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
    'X-API-Token': VPS_CONFIG.authToken,
    'User-Agent': 'Supabase-Edge-Function/1.0'
  };
}

export function makeVPSRequest(url: string, options: any = {}) {
  const defaultOptions = {
    headers: getVPSHeaders(),
    signal: AbortSignal.timeout(VPS_CONFIG.timeout)
  };
  
  return fetch(url, { ...defaultOptions, ...options });
}

export function isRealQRCode(qrCode: string): boolean {
  if (!qrCode || typeof qrCode !== 'string') return false;
  
  // Verificar se é uma string base64 válida
  if (qrCode.startsWith('data:image/')) {
    return qrCode.length > 1000; // QR codes reais são grandes
  }
  
  // Verificar se é um código QR em texto
  if (qrCode.includes('2@') && qrCode.includes(',')) {
    return qrCode.length > 100;
  }
  
  return false;
} 