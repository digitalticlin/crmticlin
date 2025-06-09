
// VPS Configuration - ATUALIZADA para HTTP direto (sem SSH)
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222', // Base URL sem porta (será descoberta dinamicamente)
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  
  endpoints: {
    health: '/health',
    status: '/status',
    instances: '/instances',
    qrCode: '/instance/{instanceId}/qr',
    sendMessage: '/send',
    createInstance: '/instance/create',
    deleteInstance: '/instance/{instanceId}',
    instanceStatus: '/instance/{instanceId}/status',
    webhookGlobal: '/webhook/global',
    webhookStatus: '/webhook/global/status',
    webhookInstance: '/instance/{instanceId}/webhook'
  },
  
  // NOVA CONFIGURAÇÃO: HTTP direto em vez de SSH
  httpDirect: {
    enabled: true,
    defaultPort: 3002,
    fallbackPorts: [3001, 3000, 8080],
    timeout: 15000,
    maxRetries: 3
  },
  
  timeouts: {
    connection: 15000,    // 15 seconds para HTTP direto
    message: 30000,       // 30 seconds  
    qrCode: 25000,        // 25 seconds
    health: 10000,        // 10 seconds
    discovery: 20000      // 20 seconds para descoberta
  },
  
  sync: {
    interval: 180000,           // 3 minutes
    healthCheckInterval: 120000, // 2 minutes
    debounceDelay: 1000,        // 1 second
    maxRetries: 3,
    backoffMultiplier: 2
  },

  // CONFIGURAÇÃO: HTTP Mode (nova implementação)
  connection: {
    mode: 'http_direct', // 'ssh' | 'http_direct'
    host: '31.97.24.222',
    timeout: 15000
  },

  // CONFIGURAÇÃO: Webhook automático
  webhook: {
    enabled: true,
    url: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
    events: ['qr.update', 'messages.upsert', 'connection.update'],
    automatic: true
  }
};

export const getEndpointUrl = (endpoint: string, port?: number): string => {
  const actualPort = port || VPS_CONFIG.httpDirect.defaultPort;
  return `${VPS_CONFIG.baseUrl}:${actualPort}${endpoint}`;
};

export const getRequestHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
    'X-API-Token': VPS_CONFIG.authToken,
    'User-Agent': 'Supabase-WhatsApp-Client/2.0-HTTP',
    'Accept': 'application/json'
  };
};

export const formatInstanceEndpoint = (endpoint: string, instanceId: string): string => {
  return endpoint.replace('{instanceId}', instanceId);
};
