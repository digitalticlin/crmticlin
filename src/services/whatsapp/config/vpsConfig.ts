
// VPS Configuration for WhatsApp Web.js Server - UNIFIED CONFIG
export const VPS_CONFIG = {
  // Primary VPS server URL
  baseUrl: 'http://31.97.24.222:3001',
  host: '31.97.24.222',
  port: 3001,
  
  // Timeouts and retry configuration
  timeout: 15000, // 15 segundos
  retries: 3,
  
  // Authentication token for VPS API - CORRIGIDO conforme Hostinger
  authToken: 'default-token', // Token padrão confirmado pela Hostinger
  
  // Health check endpoints (confirmados funcionando)
  healthEndpoints: {
    health: '/health',
    status: '/status'
  },
  
  // Instance management endpoints - CONFIRMADOS pela Hostinger
  endpoints: {
    create: '/instance/create',        // CONFIRMADO: POST /instance/create
    delete: '/instance/delete',        // CONFIRMADO: POST /instance/delete
    qr: '/instance/qr',               // CONFIRMADO: POST /instance/qr
    status: '/instance/status',        // CONFIRMADO: POST /instance/status
    instances: '/instances',          // CONFIRMADO: GET /instances
    health: '/health'                 // CONFIRMADO: GET /health
  }
};

// Helper function to get full endpoint URL
export const getEndpointUrl = (endpoint: string): string => {
  return `${VPS_CONFIG.baseUrl}${endpoint}`;
};

// Helper function to create request headers - CORRIGIDO conforme Hostinger
export const getRequestHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${VPS_CONFIG.authToken}` // Bearer default-token
});

// Payload builder para instance creation - conforme especificado pela Hostinger
export const buildInstancePayload = (instanceData: any) => ({
  instanceId: instanceData.instanceId || instanceData.vpsInstanceId,
  sessionName: instanceData.instanceName,
  webhookUrl: instanceData.webhookUrl || `${process.env.SUPABASE_URL || 'https://kigyebrhfoljnydfipcr.supabase.co'}/functions/v1/webhook_whatsapp_web`,
  companyId: instanceData.companyId
});

console.log('[VPS Config] Unified configuration loaded');
console.log('[VPS Config] Base URL:', VPS_CONFIG.baseUrl);
console.log('[VPS Config] Auth Token configured:', VPS_CONFIG.authToken !== 'default-token' ? 'Custom' : 'Default');
