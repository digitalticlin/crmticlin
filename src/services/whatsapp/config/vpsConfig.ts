
// VPS Configuration - Real data discovered from VPS
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  
  endpoints: {
    health: '/health',
    status: '/status',
    instances: '/instances',
    qrCode: '/instance/{instanceId}/qr',
    sendMessage: '/send',
    createInstance: '/instance/create',
    deleteInstance: '/instance/delete',
    instanceStatus: '/instance/{instanceId}/status'
  },
  
  timeouts: {
    connection: 10000,    // 10 seconds
    message: 30000,       // 30 seconds  
    qrCode: 25000,        // 25 seconds
    health: 5000          // 5 seconds
  },
  
  sync: {
    interval: 180000,           // 3 minutes
    healthCheckInterval: 120000, // 2 minutes
    debounceDelay: 1000,        // 1 second
    maxRetries: 3,
    backoffMultiplier: 2
  }
};

export const getEndpointUrl = (endpoint: string): string => {
  return `${VPS_CONFIG.baseUrl}${endpoint}`;
};

export const getRequestHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
    'X-API-Token': VPS_CONFIG.authToken,
    'User-Agent': 'Supabase-WhatsApp-Client/1.0',
    'Accept': 'application/json'
  };
};

export const formatInstanceEndpoint = (endpoint: string, instanceId: string): string => {
  return endpoint.replace('{instanceId}', instanceId);
};
