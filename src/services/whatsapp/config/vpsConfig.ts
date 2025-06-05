
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: 'default-token',
  endpoints: {
    health: '/health',
    instances: '/instances',
    createInstance: '/instance/create',
    deleteInstance: '/instance/delete',
    sendMessage: '/send',
    getQR: '/instance/{instanceId}/qr',
    getStatus: '/instance/{instanceId}/status',
    configureWebhook: '/instance/{instanceId}/webhook',
    restart: '/instance/restart'
  },
  webhook: {
    url: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
    events: ['messages.upsert', 'qr.update', 'connection.update']
  },
  timeouts: {
    connection: 10000,
    qrCode: 30000,
    message: 15000
  }
} as const;

export type VPSConfig = typeof VPS_CONFIG;
