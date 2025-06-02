
// VPS Configuration for WhatsApp Web.js Server
export const VPS_CONFIG = {
  // Primary VPS server URL - usando apenas a porta 3001 que está funcionando
  baseUrl: 'http://31.97.24.222:3001',
  
  // Timeouts and retry configuration
  timeout: 15000, // 15 segundos
  retries: 3,
  
  // Authentication token for VPS API
  authToken: 'default-token', // Pode ser configurado via variável de ambiente
  
  // Health check endpoints (confirmados funcionando)
  healthEndpoints: {
    health: '/health',
    status: '/status'
  },
  
  // Instance management endpoints
  endpoints: {
    create: '/create',        // Precisa ser testado com POST
    delete: '/delete',        // Precisa ser testado com POST/DELETE
    status: '/status',        // Funcionando (GET)
    instances: '/instances',  // Funcionando (GET)
    qr: '/qr',               // Precisa ser testado
    health: '/health'        // Funcionando (GET)
  }
};

// Helper function to get full endpoint URL
export const getEndpointUrl = (endpoint: string): string => {
  return `${VPS_CONFIG.baseUrl}${endpoint}`;
};

// Helper function to create request headers
export const getRequestHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${VPS_CONFIG.authToken}`
});
