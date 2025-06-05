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
  authToken: Deno.env.get('VPS_API_TOKEN') || 'default-token'
};

export const getVPSHeaders = () => {
  const token = VPS_CONFIG.authToken;
  console.log(`[VPS Config] Using token from env: ${token ? token.substring(0, 10) + '...' : 'NOT SET'} (length: ${token?.length || 0})`);
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'Supabase-WhatsApp-Integration/3.0-DIAGNOSTICO',
    'Accept': 'application/json'
  };
};

// CORREÇÃO: Validação de QR Code menos restritiva
export const isRealQRCode = (qrCode: string | null): boolean => {
  if (!qrCode) {
    console.log('[QR Validation] ❌ QR Code é null ou undefined');
    return false;
  }
  
  // Verificar se é data URL válida
  if (!qrCode.startsWith('data:image/')) {
    console.log('[QR Validation] ❌ QR Code não é data URL de imagem');
    return false;
  }
  
  // Extrair parte base64
  const parts = qrCode.split(',');
  if (parts.length !== 2) {
    console.log('[QR Validation] ❌ QR Code mal formatado (split falhou)');
    return false;
  }
  
  const base64Part = parts[1];
  
  // CORREÇÃO: Reduzir tamanho mínimo de 500 para 100 caracteres
  if (base64Part.length < 100) {
    console.log(`[QR Validation] ❌ QR Code muito pequeno: ${base64Part.length} caracteres`);
    return false;
  }
  
  // Verificar padrões conhecidos de QR falsos
  const knownFakePatterns = [
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  ];
  
  const isFake = knownFakePatterns.some(pattern => base64Part.includes(pattern));
  if (isFake) {
    console.log('[QR Validation] ❌ QR Code corresponde a padrão conhecido falso');
    return false;
  }
  
  console.log(`[QR Validation] ✅ QR Code válido: ${base64Part.length} caracteres`);
  return true;
};

export const isValidVersion = (versionString: string): boolean => {
  if (!versionString) return false;
  
  const validVersions = [
    '3.5.0', '3.4.0', '3.3.0', '3.2.0', '3.1.0', '3.0.0'
  ];
  
  if (validVersions.includes(versionString)) {
    return true;
  }
  
  const semverPattern = /^(\d+)\.(\d+)\.(\d+)$/;
  const match = versionString.match(semverPattern);
  
  if (!match) return false;
  
  const [, major, minor, patch] = match;
  const majorNum = parseInt(major);
  const minorNum = parseInt(minor);
  const patchNum = parseInt(patch);
  
  if (majorNum >= 3) {
    return true;
  }
  
  if (majorNum === 2 && minorNum >= 15) {
    return true;
  }
  
  return false;
};

export const testVPSConnection = async (): Promise<{success: boolean, error?: string, details?: any}> => {
  try {
    console.log('[VPS Test] 🔧 Testando conectividade VPS (TOKEN CORRIGIDO)...');
    console.log('[VPS Test] URL:', VPS_CONFIG.baseUrl);
    console.log('[VPS Test] Token source:', VPS_CONFIG.authToken === 'default-token' ? 'HARDCODED (PROBLEMA!)' : 'ENV SECRET');
    
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

console.log('[Config] VPS Config initialized (TOKEN CORRIGIDO):');
console.log('[Config] Host:', VPS_CONFIG.host);
console.log('[Config] Port:', VPS_CONFIG.port);
console.log('[Config] Base URL:', VPS_CONFIG.baseUrl);
console.log('[Config] Auth Token Source:', VPS_CONFIG.authToken === 'default-token' ? 'HARDCODED (VERIFICAR!)' : 'ENV SECRET (OK)');
