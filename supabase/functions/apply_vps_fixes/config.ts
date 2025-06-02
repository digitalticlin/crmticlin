
import { VPSAPIConfig } from './types.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const VPS_API_CONFIG: VPSAPIConfig = {
  host: '31.97.24.222',
  port: 3002,
  baseUrl: 'http://31.97.24.222:3002',
  token: 'vps-api-token-2024' // Token será configurado via secret
};
