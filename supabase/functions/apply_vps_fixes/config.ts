
import { VPSSSHConfig } from './types.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const VPS_SSH_CONFIG: VPSSSHConfig = {
  host: '31.97.24.222',
  port: 22,
  username: 'root'
};
