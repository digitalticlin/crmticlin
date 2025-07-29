
// Security fix: Remove hardcoded credentials and use environment variables
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.163.57:3001',
  // Token will be retrieved from Edge Function secrets
  endpoints: {
    createInstance: '/instances',
    getQRCode: '/instance/:id/qr',
    getStatus: '/instance/:id/status'
  }
} as const;

// Webhook URL moved to Edge Function environment
export const WEBHOOK_URL = 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_qr_receiver';

export const EDGE_FUNCTION_CONFIG = {
  name: 'whatsapp_instance_manager',
  actions: {
    createInstance: 'create_instance',
    getQRCode: 'get_qr_code',
    deleteInstance: 'delete_instance',
    healthCheck: 'health_check'
  }
} as const;
