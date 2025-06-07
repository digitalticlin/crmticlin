
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  timeout: 30000,
  endpoints: {
    createInstance: '/instance/create',
    deleteInstance: '/instance/delete',
    getQRDirect: '/instance/{instanceId}/qr',
    instances: '/instances'
  }
};

export function getVPSHeaders() {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

export function isRealQRCode(qrCode: string): boolean {
  if (!qrCode || typeof qrCode !== 'string') return false;
  if (qrCode.length < 50) return false;
  if (qrCode.includes('error') || qrCode.includes('Error')) return false;
  return qrCode.startsWith('data:image/') || qrCode.length > 100;
}

export function normalizeQRCode(qrCode: string): string {
  if (!qrCode) return '';
  if (qrCode.startsWith('data:image/')) return qrCode;
  return `data:image/png;base64,${qrCode}`;
}
