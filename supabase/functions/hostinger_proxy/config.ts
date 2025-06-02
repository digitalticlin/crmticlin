
import { VPSConfig } from './types.ts';

export const VPS_CONFIG: VPSConfig = {
  hostname: '31.97.24.222',
  port: 22,
  username: 'root',
  timeout: 60000 // 60 segundos para comandos longos
};

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
