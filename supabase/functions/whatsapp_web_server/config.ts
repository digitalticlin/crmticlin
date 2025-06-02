
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
