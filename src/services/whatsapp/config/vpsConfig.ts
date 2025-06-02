
// VPS Configuration for WhatsApp Web.js Server
export const VPS_CONFIG = {
  // Primary VPS server URL (porta 3001 para WhatsApp Web.js)
  baseUrl: 'http://31.97.24.222:3001',
  
  // API server URL (porta 80 para Evolution API - compatibilidade)
  apiUrl: 'http://31.97.24.222:80',
  
  // Timeouts and retry configuration
  timeout: 15000, // 15 segundos
  retries: 3,
  
  // Authentication token for VPS API
  authToken: 'default-token', // Pode ser configurado via variável de ambiente
  
  // Health check endpoints
  healthEndpoints: {
    whatsapp: '/health',
    api: '/health',
    status: '/status'
  },
  
  // Instance management endpoints
  endpoints: {
    create: '/create',
    delete: '/delete',
    status: '/status',
    instances: '/instances',
    qr: '/qr'
  }
};

// Helper function to get full endpoint URL
export const getEndpointUrl = (endpoint: string, useApiUrl = false): string => {
  const baseUrl = useApiUrl ? VPS_CONFIG.apiUrl : VPS_CONFIG.baseUrl;
  return `${baseUrl}${endpoint}`;
};

// Helper function to create request headers
export const getRequestHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${VPS_CONFIG.authToken}`
});
