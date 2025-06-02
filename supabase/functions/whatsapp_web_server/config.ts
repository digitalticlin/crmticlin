
import { VPSCredentials } from './types.ts';

export const VPS_CONFIG: VPSCredentials = {
  host: '31.97.24.222',
  port: 3001,
  baseUrl: 'http://31.97.24.222:3001',
  authToken: Deno.env.get('VPS_API_TOKEN') || 'default-token'
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Logs de configuração para debug
console.log(`[Config] VPS Config initialized:`);
console.log(`[Config] Host: ${VPS_CONFIG.host}`);
console.log(`[Config] Port: ${VPS_CONFIG.port}`);
console.log(`[Config] Base URL: ${VPS_CONFIG.baseUrl}`);
console.log(`[Config] Auth Token configured: ${VPS_CONFIG.authToken !== 'default-token'}`);
