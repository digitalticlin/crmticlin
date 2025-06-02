
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
  authToken: Deno.env.get('VPS_API_TOKEN') || 'default-token'
};

console.log('[Config] VPS Config initialized:');
console.log('[Config] Host:', VPS_CONFIG.host);
console.log('[Config] Port:', VPS_CONFIG.port);
console.log('[Config] Base URL:', VPS_CONFIG.baseUrl);
console.log('[Config] Auth Token:', VPS_CONFIG.authToken);
console.log('[Config] Using custom token:', VPS_CONFIG.authToken !== 'default-token');
