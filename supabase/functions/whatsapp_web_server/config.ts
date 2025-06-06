
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: 'default-token', // FASE 1.2: Token padrão - deve ser configurado corretamente
  timeout: 15000, // 15 segundos
  endpoints: {
    // FASE 1.2: Endpoints corrigidos baseados na análise
    createInstance: '/instance/create',
    deleteInstance: '/instance/delete', 
    getQR: '/instance/qr', // POST com instanceId no body
    getQRAlternative: '/instance/{instanceId}/qr', // GET alternativo
    getStatus: '/instance/status',
    instances: '/instances'
  }
};

export const getVPSHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
  'Accept': 'application/json'
});

// FASE 1.2: Função para validar QR Code real
export const isRealQRCode = (qrCode: string): boolean => {
  if (!qrCode || typeof qrCode !== 'string') return false;
  
  // Verificar se é data URL válido
  if (qrCode.startsWith('data:image/')) {
    const base64Part = qrCode.split(',')[1];
    return base64Part && base64Part.length > 500; // QR Code real tem tamanho significativo
  }
  
  // Verificar se é Base64 puro (sem data URL prefix)
  if (qrCode.length > 500) {
    try {
      atob(qrCode); // Tentar decodificar Base64
      return true;
    } catch {
      return false;
    }
  }
  
  return false;
};

// FASE 1.2: Normalizar formato do QR Code
export const normalizeQRCode = (qrCode: string): string => {
  if (!qrCode) return '';
  
  // Se já é data URL, retornar como está
  if (qrCode.startsWith('data:image/')) {
    return qrCode;
  }
  
  // Se é Base64 puro, adicionar prefixo data URL
  if (qrCode.length > 500) {
    return `data:image/png;base64,${qrCode}`;
  }
  
  return qrCode;
};
