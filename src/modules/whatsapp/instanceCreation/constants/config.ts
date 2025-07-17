export const VPS_CONFIG = {
  baseUrl: 'http://31.97.163.57:3001',  // CORREÇÃO: VPS correta unificada
  token: 'bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1',  // CORREÇÃO: Token unificado
  endpoints: {
    createInstance: '/instances',  // CORREÇÃO: Endpoint correto
    getQRCode: '/instance/:id/qr',
    getStatus: '/instance/:id/status'
  }
} as const;

// CORREÇÃO: URL correta do webhook
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