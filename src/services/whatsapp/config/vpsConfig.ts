
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3', // Token corrigido
  endpoints: {
    health: '/health',
    instances: '/instances',
    createInstance: '/instance/create',
    deleteInstance: '/instance/delete',
    sendMessage: '/send',
    getQR: '/instance/{instanceId}/qr', // Endpoint GET para QR
    getStatus: '/instance/{instanceId}/status',
    configureWebhook: '/instance/{instanceId}/webhook',
    restart: '/instance/restart',
    // CORREÇÃO: Novos endpoints baseados na estrutura real da VPS
    getQRDirect: '/qr/{instanceId}', // Endpoint direto para QR Code
    instanceStatus: '/status/{instanceId}' // Status da instância
  },
  webhook: {
    url: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_qr_service',
    events: ['messages.upsert', 'qr.update', 'connection.update']
  },
  timeouts: {
    connection: 20000, // Aumentado para 20s devido à instabilidade
    qrCode: 60000, // Aumentado para 60s
    message: 25000
  },
  sync: {
    interval: 90000, // Reduzido para 90s devido à instabilidade
    debounceDelay: 1200,
    healthCheckInterval: 15000
  },
  // CORREÇÃO: Tokens alternativos para teste
  fallbackTokens: [
    'default-token',
    'whatsapp-token',
    'api-token',
    'bearer-token'
  ]
} as const;

export type VPSConfig = typeof VPS_CONFIG;

// CORREÇÃO: Função para construir URLs com endpoints corretos
export const getEndpointUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, value);
    });
  }
  
  return url;
};

// CORREÇÃO: Headers com múltiplas formas de autenticação
export const getRequestHeaders = (token?: string): Record<string, string> => {
  const authToken = token || VPS_CONFIG.authToken;
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
    'X-API-Token': authToken,
    'apikey': authToken,
    'User-Agent': 'Supabase-WhatsApp-Client/2.0',
    'Accept': 'application/json'
  };
};

// CORREÇÃO: Função para validar se QR Code é real
export const isRealQRCode = (qrCode: string): boolean => {
  if (!qrCode || typeof qrCode !== 'string') return false;
  
  // QR Code válido deve ter pelo menos 100 caracteres e começar com padrões conhecidos
  if (qrCode.length < 100) return false;
  
  // Verificar padrões de QR Code do WhatsApp
  const validPatterns = [
    qrCode.startsWith('data:image/'),
    qrCode.includes('whatsapp'),
    qrCode.includes('@c.us'),
    qrCode.match(/^[A-Za-z0-9+/]+=*$/) && qrCode.length > 200 // Base64
  ];
  
  return validPatterns.some(pattern => pattern);
};

// CORREÇÃO: Normalizar QR Code para formato padrão
export const normalizeQRCode = (qrCode: string): string => {
  if (!qrCode) return '';
  
  // Se já é data URL, retornar como está
  if (qrCode.startsWith('data:image/')) {
    return qrCode;
  }
  
  // Se é base64 puro, converter para data URL
  if (qrCode.match(/^[A-Za-z0-9+/]+=*$/)) {
    return `data:image/png;base64,${qrCode}`;
  }
  
  return qrCode;
};
