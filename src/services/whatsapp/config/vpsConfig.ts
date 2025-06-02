
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
  
  // Instance management endpoints - CORRIGIDOS conforme suporte Hostinger
  endpoints: {
    create: '/instance/create',        // Corrigido: era /create
    delete: '/instance/delete',        // Corrigido: era /delete
    qr: '/instance/qr',               // Corrigido: era /qr
    status: '/instance/status',        // Corrigido: era /status
    instances: '/instances',          // Mantido (funcionando)
    health: '/health'                 // Mantido (funcionando)
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
