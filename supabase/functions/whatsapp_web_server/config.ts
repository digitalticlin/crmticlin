
// CORREÇÃO COMPLETA: Configuração robusta para VPS
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// CORREÇÃO: Configuração VPS com token correto
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  timeout: 30000, // 30 segundos
  endpoints: {
    createInstance: '/instance/create',
    deleteInstance: '/instance/delete',
    getQRDirect: '/instance/qr/{instanceId}',
    instances: '/instances',
    status: '/instance/status',
    connect: '/instance/connect'
  }
};

// CORREÇÃO: Função para obter headers VPS com token correto
export function getVPSHeaders(): Record<string, string> {
  // Token correto que começa com "3"
  const vpsToken = Deno.env.get('VPS_API_TOKEN') || '3default-token';
  
  console.log(`[VPS Config] 🔑 Token usado: ${vpsToken.substring(0, 5)}...`);
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${vpsToken}`,
    'X-API-Token': vpsToken,
    'apikey': vpsToken
  };
}

// CORREÇÃO: Validação de QR Code melhorada
export function isRealQRCode(qrCode: string): boolean {
  if (!qrCode || typeof qrCode !== 'string') {
    return false;
  }
  
  // QR Code deve ter tamanho mínimo e formato válido
  if (qrCode.length < 50) {
    return false;
  }
  
  // Verificar se é base64 válido ou URL
  const isBase64 = /^data:image\/[a-zA-Z]+;base64,/.test(qrCode);
  const isValidString = qrCode.includes('@') || qrCode.includes('whatsapp') || isBase64;
  
  return isValidString;
}

// CORREÇÃO: Normalização de QR Code
export function normalizeQRCode(qrCode: string): string {
  if (!qrCode) return '';
  
  // Se já é data URL, retornar como está
  if (qrCode.startsWith('data:image/')) {
    return qrCode;
  }
  
  // Se é base64 puro, adicionar header
  if (qrCode.length > 100 && !qrCode.includes('http')) {
    return `data:image/png;base64,${qrCode}`;
  }
  
  return qrCode;
}
