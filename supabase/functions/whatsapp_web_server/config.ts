
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

// FUNÇÃO CRÍTICA: Valida se o QR Code é real (não placeholder)
export function isRealQRCode(qrCode: string): boolean {
  if (!qrCode || typeof qrCode !== 'string') {
    return false;
  }
  
  // QR Code real deve ter pelo menos 100 caracteres
  if (qrCode.length < 100) {
    return false;
  }
  
  // QR Code real normalmente começa com data: ou é uma string base64 longa
  const isDataUrl = qrCode.startsWith('data:image/');
  const isBase64Like = qrCode.length > 200 && /^[A-Za-z0-9+/=]+$/.test(qrCode);
  
  return isDataUrl || isBase64Like;
}

// Função de teste de conectividade VPS
export async function testVPSConnection() {
  try {
    console.log('[VPS Test] Testando conectividade com:', VPS_CONFIG.baseUrl);
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[VPS Test] ✅ VPS acessível:', data);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.error('[VPS Test] ❌ VPS retornou erro:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error('[VPS Test] 💥 Erro de conectividade:', error);
    return { success: false, error: error.message };
  }
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
