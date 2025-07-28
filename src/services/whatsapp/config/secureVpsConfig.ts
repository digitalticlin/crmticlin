
// Secure VPS Configuration - Using environment variables
export const getSecureVpsConfig = () => {
  // In production, these should come from Supabase Edge Function secrets
  const baseUrl = import.meta.env.VITE_VPS_BASE_URL || 'http://31.97.163.57:3001';
  const authToken = import.meta.env.VITE_VPS_AUTH_TOKEN || 'bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1';
  
  if (!baseUrl || !authToken) {
    throw new Error('VPS credentials not properly configured');
  }

  return {
    baseUrl,
    authToken,
    
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
    
    httpDirect: {
      enabled: true,
      port: 3001,
      timeout: 15000,
      maxRetries: 3
    },
    
    timeouts: {
      connection: 15000,
      message: 30000,
      qrCode: 25000,
      health: 10000,
      discovery: 20000
    },
    
    sync: {
      interval: 180000,
      healthCheckInterval: 120000,
      debounceDelay: 1000,
      maxRetries: 3,
      backoffMultiplier: 2
    },

    connection: {
      mode: 'http_direct',
      host: '31.97.163.57',
      port: 3001,
      timeout: 15000
    },

    webhook: {
      enabled: true,
      url: 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web',
      events: ['qr.update', 'messages.upsert', 'connection.update'],
      automatic: true
    }
  };
};

export const getEndpointUrl = (endpoint: string): string => {
  const config = getSecureVpsConfig();
  return `${config.baseUrl}${endpoint}`;
};

export const getRequestHeaders = (): Record<string, string> => {
  const config = getSecureVpsConfig();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.authToken}`,
    'X-API-Token': config.authToken,
    'User-Agent': 'Supabase-WhatsApp-Client/3.0-Secure',
    'Accept': 'application/json'
  };
};

export const formatInstanceEndpoint = (endpoint: string, instanceId: string): string => {
  return endpoint.replace('{instanceId}', instanceId);
};
