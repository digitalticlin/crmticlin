
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
  // CORREÇÃO FASE 3: Usar token que a VPS espera conforme logs SSH
  authToken: 'default-token' // VPS espera exatamente este token
};

// CORREÇÃO FASE 3: Helper function to get VPS headers with token correto
export const getVPSHeaders = () => {
  const token = VPS_CONFIG.authToken;
  console.log(`[VPS Config] Using token (FASE 3): ${token.substring(0, 10)}... (length: ${token.length})`);
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'Supabase-WhatsApp-Integration/3.0-FASE3',
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

// CORREÇÃO FASE 3: Função de validação de versão corrigida para aceitar 3.5.0+
export const isValidVersion = (versionString: string): boolean => {
  if (!versionString) return false;
  
  // Versões válidas conhecidas do WhatsApp Web.js (FASE 3 - incluindo 3.5.0)
  const validVersions = [
    '3.5.0', // Versão confirmada via SSH - VÁLIDA
    '3.4.0',
    '3.3.0',
    '3.2.0',
    '3.1.0',
    '3.0.0'
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
  
  // Aceitar todas as versões 3.x como válidas (correção principal FASE 3)
  if (majorNum >= 3) {
    return true;
  }
  
  // Para versões 2.x, aceitar apenas 2.15.0+
  if (majorNum === 2 && minorNum >= 15) {
    return true;
  }
  
  return false;
};

// CORREÇÃO FASE 3: Função de teste de conectividade VPS corrigida
export const testVPSConnection = async (): Promise<{success: boolean, error?: string, details?: any}> => {
  try {
    console.log('[VPS Test] 🔧 Testando conectividade VPS (FASE 3)...');
    console.log('[VPS Test] URL:', VPS_CONFIG.baseUrl);
    console.log('[VPS Test] Token (FASE 3):', VPS_CONFIG.authToken);
    
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
        
        // CORREÇÃO FASE 3: Validar versão corretamente (aceitar 3.5.0 como válida)
        if (data.version && isValidVersion(data.version)) {
          console.log('[VPS Test] ✅ VPS conectado com versão válida (FASE 3):', data.version);
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

console.log('[Config] VPS Config initialized (FIXED v3 - FASE 3):');
console.log('[Config] Host:', VPS_CONFIG.host);
console.log('[Config] Port:', VPS_CONFIG.port);
console.log('[Config] Base URL:', VPS_CONFIG.baseUrl);
console.log('[Config] Auth Token (FASE 3):', VPS_CONFIG.authToken);
console.log('[Config] Using correct token for VPS:', VPS_CONFIG.authToken === 'default-token');
