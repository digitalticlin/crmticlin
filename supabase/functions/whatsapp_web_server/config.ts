
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
  // TOKEN CORRIGIDO: Usar a secret VPS_API_TOKEN corretamente
  authToken: Deno.env.get('VPS_API_TOKEN') || 'default-token'
};

// Helper function to get VPS headers with CORRECT authentication
export const getVPSHeaders = () => {
  const token = VPS_CONFIG.authToken;
  console.log(`[VPS Config] Using token: ${token.substring(0, 10)}... (length: ${token.length})`);
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'Supabase-WhatsApp-Integration/2.0',
    'Accept': 'application/json'
  };
};

// Helper function to validate QR code is real (not placeholder)
export const isRealQRCode = (qrCode: string | null): boolean => {
  if (!qrCode || !qrCode.startsWith('data:image/')) {
    return false;
  }
  
  // Check if base64 content is substantial (real QR codes are much larger)
  const base64Part = qrCode.split(',')[1];
  if (!base64Part || base64Part.length < 500) {
    return false;
  }
  
  // Check for known fake/placeholder patterns
  const knownFakePatterns = [
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  ];
  
  return !knownFakePatterns.some(pattern => base64Part.includes(pattern));
};

// CORREÇÃO: Função de validação de versão atualizada
export const isValidVersion = (versionString: string): boolean => {
  if (!versionString) return false;
  
  // Versões válidas conhecidas do WhatsApp Web.js
  const validVersions = [
    '3.5.0', // Versão atual da VPS
    '3.4.0',
    '3.3.0',
    '3.2.0',
    '3.1.0',
    '3.0.0',
    '2.15.0'
  ];
  
  // Verificar se é uma versão exata conhecida
  if (validVersions.includes(versionString)) {
    return true;
  }
  
  // Verificar padrão semver (major.minor.patch)
  const semverPattern = /^(\d+)\.(\d+)\.(\d+)$/;
  const match = versionString.match(semverPattern);
  
  if (!match) return false;
  
  const [, major, minor, patch] = match;
  const majorNum = parseInt(major);
  const minorNum = parseInt(minor);
  const patchNum = parseInt(patch);
  
  // Considerar válido se major >= 3 (versões modernas)
  if (majorNum >= 3) {
    return true;
  }
  
  // Para versões 2.x, aceitar apenas 2.15.0+
  if (majorNum === 2 && minorNum >= 15) {
    return true;
  }
  
  return false;
};

// NOVO: Função de teste de conectividade VPS aprimorada
export const testVPSConnection = async (): Promise<{success: boolean, error?: string, details?: any}> => {
  try {
    console.log('[VPS Test] 🔧 Testando conectividade VPS...');
    console.log('[VPS Test] URL:', VPS_CONFIG.baseUrl);
    console.log('[VPS Test] Token length:', VPS_CONFIG.authToken.length);
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(10000)
    });

    const responseText = await response.text();
    console.log('[VPS Test] Response status:', response.status);
    console.log('[VPS Test] Response text:', responseText);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        
        // CORREÇÃO: Validar versão corretamente
        if (data.version && isValidVersion(data.version)) {
          console.log('[VPS Test] ✅ VPS conectado com versão válida:', data.version);
        } else {
          console.log('[VPS Test] ⚠️ VPS conectado mas versão não reconhecida:', data.version);
        }
        
        return { success: true, details: data };
      } catch {
        return { success: true, details: { raw: responseText } };
      }
    } else {
      console.error('[VPS Test] ❌ VPS retornou erro:', response.status, responseText);
      return { 
        success: false, 
        error: `VPS Error ${response.status}: ${responseText}`,
        details: { status: response.status, response: responseText }
      };
    }
  } catch (error) {
    console.error('[VPS Test] 💥 Erro de conectividade:', error);
    return { 
      success: false, 
      error: `Connectivity Error: ${error.message}`,
      details: { error: error.message }
    };
  }
};

console.log('[Config] VPS Config initialized (FIXED v2):');
console.log('[Config] Host:', VPS_CONFIG.host);
console.log('[Config] Port:', VPS_CONFIG.port);
console.log('[Config] Base URL:', VPS_CONFIG.baseUrl);
console.log('[Config] Auth Token length:', VPS_CONFIG.authToken.length);
console.log('[Config] Using custom token:', VPS_CONFIG.authToken !== 'default-token');
