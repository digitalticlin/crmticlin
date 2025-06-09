
// VPS Configuration - ATUALIZADA para descoberta automática de porta via SSH
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
    // NOVOS: Endpoints de webhook
    webhookGlobal: '/webhook/global',
    webhookStatus: '/webhook/global/status',
    webhookInstance: '/instance/{instanceId}/webhook'
  },
  
  // NOVA CONFIGURAÇÃO: Descoberta automática de porta
  portDiscovery: {
    enabled: true,
    defaultPort: 3001,
    fallbackPort: 3002,
    testPorts: [3001, 3002, 3000, 8080],
    timeout: 5000
  },
  
  timeouts: {
    connection: 10000,    // 10 seconds
    message: 30000,       // 30 seconds  
    qrCode: 25000,        // 25 seconds
    health: 5000,         // 5 seconds
    portDiscovery: 15000  // 15 seconds for port discovery
  },
  
  sync: {
    interval: 180000,           // 3 minutes
    healthCheckInterval: 120000, // 2 minutes
    debounceDelay: 1000,        // 1 second
    maxRetries: 3,
    backoffMultiplier: 2
  },

  // CONFIGURAÇÃO: SSH Mode (nova implementação)
  ssh: {
    enabled: true,
    host: '31.97.24.222',
    port: 22,
    username: 'root',
    timeout: 60000
  },

  // NOVA CONFIGURAÇÃO: Webhook automático
  webhook: {
    enabled: true,
    url: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
    events: ['qr.update', 'messages.upsert', 'connection.update'],
    automatic: true
  }
};

export const getEndpointUrl = (endpoint: string, port?: number): string => {
  const actualPort = port || VPS_CONFIG.portDiscovery.defaultPort;
  return `${VPS_CONFIG.baseUrl}:${actualPort}${endpoint}`;
};

export const getRequestHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
    'X-API-Token': VPS_CONFIG.authToken,
    'User-Agent': 'Supabase-WhatsApp-Client/2.0-SSH',
    'Accept': 'application/json'
  };
};

export const formatInstanceEndpoint = (endpoint: string, instanceId: string): string => {
  return endpoint.replace('{instanceId}', instanceId);
};
