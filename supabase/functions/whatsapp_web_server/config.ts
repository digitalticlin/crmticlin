
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: 'default-token',
  timeout: 10000
} as const;

export const getVPSHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
  'X-API-Key': VPS_CONFIG.authToken,
  'Accept': 'application/json'
});
