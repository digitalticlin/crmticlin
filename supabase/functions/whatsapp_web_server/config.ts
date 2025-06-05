
// Configuração corrigida com base nos testes realizados
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuração da VPS baseada nos testes de conectividade
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001', // IP confirmado e funcional
  timeout: 30000,
  retries: 3
};

// Headers corrigidos para VPS - sem token por enquanto baseado nos testes
export function getVPSHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Supabase-WhatsApp-Integration/4.0-SYNC-FIX',
    'Accept': 'application/json'
  };

  // Verificar se o token VPS está configurado
  const vpsToken = Deno.env.get('VPS_API_TOKEN');
  console.log('[VPS Config] Token status:', { 
    hasToken: !!vpsToken, 
    tokenLength: vpsToken?.length || 0 
  });

  // Adicionar token apenas se estiver configurado e não for vazio
  if (vpsToken && vpsToken.trim() !== '' && vpsToken !== 'undefined') {
    headers['Authorization'] = `Bearer ${vpsToken}`;
    console.log('[VPS Config] Authorization header adicionado');
  } else {
    console.log('[VPS Config] Sem token configurado - usando acesso sem autenticação');
  }

  return headers;
}

// Função para logs detalhados de configuração
export function logVPSConfig() {
  console.log('[VPS Config] Configuração atual:', {
    baseUrl: VPS_CONFIG.baseUrl,
    timeout: VPS_CONFIG.timeout,
    retries: VPS_CONFIG.retries,
    hasToken: !!Deno.env.get('VPS_API_TOKEN'),
    headers: getVPSHeaders()
  });
}
