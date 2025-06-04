
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
  // CORREÇÃO CRÍTICA: Usar a secret VPS_API_TOKEN corretamente
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
        console.log('[VPS Test] ✅ VPS conectado:', data);
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

console.log('[Config] VPS Config initialized (FIXED):');
console.log('[Config] Host:', VPS_CONFIG.host);
console.log('[Config] Port:', VPS_CONFIG.port);
console.log('[Config] Base URL:', VPS_CONFIG.baseUrl);
console.log('[Config] Auth Token length:', VPS_CONFIG.authToken.length);
console.log('[Config] Using custom token:', VPS_CONFIG.authToken !== 'default-token');
