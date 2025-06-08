
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  endpoints: {
    health: '/health',
    instances: '/instances',
    createInstance: '/instance/create',
    // CORREÇÃO: Endpoints corretos baseados na análise da VPS
    deleteInstance: '/instance/delete', // POST com body {instanceId}
    getQRCode: '/instance/qr', // POST com body {instanceId}
    sendMessage: '/send', // POST com body {instanceId, to, message}
    getStatus: '/instance/status', // Mantido - já funciona
    configureWebhook: '/instance/{instanceId}/webhook',
    restart: '/instance/restart',
    // REMOVIDO: Endpoints que não existem na VPS
    // getQR: '/instance/{instanceId}/qr',
    // getQRDirect: '/qr/{instanceId}',
    // instanceStatus: '/status/{instanceId}'
  },
  webhook: {
    url: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
    events: ['messages.upsert', 'qr.update', 'connection.update']
  },
  timeouts: {
    connection: 20000,
    qrCode: 60000,
    message: 25000
  },
  sync: {
    interval: 90000,
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

// CORREÇÃO: Função para construir URLs (simplificada, sem {params})
export const getEndpointUrl = (endpoint: string): string => {
  return `${VPS_CONFIG.baseUrl}${endpoint}`;
};

// CORREÇÃO: Headers mantidos iguais (já funcionam)
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

// CORREÇÃO: Função para validar se QR Code é real (mantida)
export const isRealQRCode = (qrCode: string): boolean => {
  if (!qrCode || typeof qrCode !== 'string') return false;
  
  if (qrCode.length < 100) return false;
  
  const validPatterns = [
    qrCode.startsWith('data:image/'),
    qrCode.includes('whatsapp'),
    qrCode.includes('@c.us'),
    qrCode.match(/^[A-Za-z0-9+/]+=*$/) && qrCode.length > 200
  ];
  
  return validPatterns.some(pattern => pattern);
};

// CORREÇÃO: Normalizar QR Code (mantida)
export const normalizeQRCode = (qrCode: string): string => {
  if (!qrCode) return '';
  
  if (qrCode.startsWith('data:image/')) {
    return qrCode;
  }
  
  if (qrCode.match(/^[A-Za-z0-9+/]+=*$/)) {
    return `data:image/png;base64,${qrCode}`;
  }
  
  return qrCode;
};
