
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const VPS_CONFIG = {
  host: Deno.env.get('VPS_HOST') || '31.97.24.222',
  port: Deno.env.get('VPS_PORT') || '3001',
  get baseUrl() {
    return `http://${this.host}:${this.port}`;
  },
  // FIX CRÍTICO: Usar a secret configurada corretamente
  authToken: Deno.env.get('VPS_API_TOKEN') || 'default-token'
};

// Helper function to get VPS headers with correct authentication
export const getVPSHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${VPS_CONFIG.authToken}`
});

// Helper function to validate QR code is real (not placeholder)
export const isRealQRCode = (qrCode: string | null): boolean => {
  if (!qrCode || !qrCode.startsWith('data:image/')) {
    return false;
  }
  
  // Check if base64 content is substantial (real QR codes are much larger)
  const base64Part = qrCode.split(',')[1];
  if (!base64Part || base64Part.length < 500) {
    return false;
  }
  
  // Check for known fake/placeholder patterns
  const knownFakePatterns = [
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  ];
  
  return !knownFakePatterns.some(pattern => base64Part.includes(pattern));
};

console.log('[Config] VPS Config initialized:');
console.log('[Config] Host:', VPS_CONFIG.host);
console.log('[Config] Port:', VPS_CONFIG.port);
console.log('[Config] Base URL:', VPS_CONFIG.baseUrl);
console.log('[Config] Auth Token length:', VPS_CONFIG.authToken.length);
console.log('[Config] Using custom token:', VPS_CONFIG.authToken !== 'default-token');
