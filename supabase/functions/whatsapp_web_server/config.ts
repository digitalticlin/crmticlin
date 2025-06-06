export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: 'default-token', // FASE 2.0: Token que funciona com sua VPS
  timeout: 20000, // FASE 2.0: 20 segundos
  endpoints: {
    // FASE 2.0: Endpoints corretos para sua VPS
    createInstance: '/instance/create',
    deleteInstance: '/instance/delete', 
    getQR: '/instance/qr', // POST com instanceId no body
    getQRAlternative: '/instance/{instanceId}/qr', // GET alternativo
    getStatus: '/instance/status',
    instances: '/instances',
    sendMessage: '/send' // FASE 2.0: Endpoint para envio de mensagens
  }
};

export const getVPSHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
  'Accept': 'application/json',
  'User-Agent': 'Supabase-Edge-Function/1.0'
});

// FASE 1.3: Função melhorada para validar QR Code real
export const isRealQRCode = (qrCode: string): boolean => {
  if (!qrCode || typeof qrCode !== 'string') {
    console.log('[QR Validation] ❌ FASE 1.3 - QR Code inválido: não é string');
    return false;
  }
  
  // Verificar se é data URL válido
  if (qrCode.startsWith('data:image/')) {
    const base64Part = qrCode.split(',')[1];
    const isValid = base64Part && base64Part.length > 500;
    console.log('[QR Validation] 🔍 FASE 1.3 - Data URL:', {
      hasBase64Part: !!base64Part,
      base64Length: base64Part ? base64Part.length : 0,
      isValid
    });
    return isValid;
  }
  
  // Verificar se é Base64 puro (sem data URL prefix)
  if (qrCode.length > 500) {
    try {
      atob(qrCode); // Tentar decodificar Base64
      console.log('[QR Validation] ✅ FASE 1.3 - Base64 puro válido:', qrCode.length);
      return true;
    } catch {
      console.log('[QR Validation] ❌ FASE 1.3 - Base64 inválido');
      return false;
    }
  }
  
  console.log('[QR Validation] ❌ FASE 1.3 - QR Code muito pequeno:', qrCode.length);
  return false;
};

// FASE 1.3: Normalizar formato do QR Code com logs
export const normalizeQRCode = (qrCode: string): string => {
  if (!qrCode) {
    console.log('[QR Normalize] ❌ FASE 1.3 - QR Code vazio');
    return '';
  }
  
  // Se já é data URL, retornar como está
  if (qrCode.startsWith('data:image/')) {
    console.log('[QR Normalize] ✅ FASE 1.3 - Já é data URL');
    return qrCode;
  }
  
  // Se é Base64 puro, adicionar prefixo data URL
  if (qrCode.length > 500) {
    const normalized = `data:image/png;base64,${qrCode}`;
    console.log('[QR Normalize] ✅ FASE 1.3 - Convertido para data URL:', {
      originalLength: qrCode.length,
      normalizedLength: normalized.length
    });
    return normalized;
  }
  
  console.log('[QR Normalize] ⚠️ FASE 1.3 - QR Code muito pequeno, retornando original');
  return qrCode;
};

// FASE 1.3: Função para testar conectividade da VPS
export const testVPSConnectivity = async (): Promise<boolean> => {
  try {
    console.log('[VPS Test] 🔗 FASE 1.3 - Testando conectividade da VPS...');
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(5000)
    });
    
    const isConnected = response.ok;
    console.log('[VPS Test] 📊 FASE 1.3 - Resultado do teste:', {
      url: `${VPS_CONFIG.baseUrl}/health`,
      status: response.status,
      isConnected
    });
    
    return isConnected;
  } catch (error: any) {
    console.error('[VPS Test] ❌ FASE 1.3 - Falha na conectividade:', error.message);
    return false;
  }
};
