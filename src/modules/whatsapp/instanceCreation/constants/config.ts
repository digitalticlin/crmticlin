export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  token: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  endpoints: {
    createInstance: '/instance/create',
    getQRCode: '/instance/:id/qr',
    getStatus: '/instance/:id/status'
  }
} as const;

export const WEBHOOK_URL = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';

export const EDGE_FUNCTION_CONFIG = {
  name: 'whatsapp_instance_manager',
  actions: {
    createInstance: 'create_instance',
    getQRCode: 'get_qr_code',
    deleteInstance: 'delete_instance',
    healthCheck: 'health_check'
  }
} as const; 