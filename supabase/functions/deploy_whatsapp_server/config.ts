
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const VPS_CONFIG = {
  host: '31.97.24.222',
  apiPort: 80, // Porta 80 para API
  whatsappPort: 3001,
  baseUrl: 'http://31.97.24.222' // URL sem porta explícita (HTTP usa 80 por padrão)
};
