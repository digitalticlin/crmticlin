
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: 'default-token', // TESTE: Usar token fixo para testar
  timeout: 25000,
  endpoints: {
    createInstance: '/instance/create',
    deleteInstance: '/instance/delete', 
    getQR: '/instance/qr',
    getQRDirect: '/instance/{instanceId}/qr',
    getStatus: '/instance/{instanceId}/status',
    instances: '/instances',
    sendMessage: '/send'
  }
};

export const getVPSHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
  'Accept': 'application/json',
  'User-Agent': 'Supabase-Edge-Function/1.0'
});

// CORREÇÃO CRÍTICA: Aceitar QR Code em formato TEXTO da VPS
export const isRealQRCode = (qrCode: string): boolean => {
  if (!qrCode || typeof qrCode !== 'string') {
    console.log('[QR Validation] ❌ QR Code inválido: não é string');
    return false;
  }
  
  // CORREÇÃO: Aceitar QR Code em formato texto (da VPS)
  if (qrCode.length > 10) { // QR Code válido (texto ou data URL) tem pelo menos 10 caracteres
    console.log('[QR Validation] ✅ QR Code válido (texto ou data URL):', qrCode.length);
    return true;
  }
  
  console.log('[QR Validation] ❌ QR Code muito pequeno:', qrCode.length);
  return false;
};

// CORREÇÃO: Aceitar e normalizar QR Code em formato texto
export const normalizeQRCode = (qrCode: string): string => {
  if (!qrCode) {
    console.log('[QR Normalize] ❌ QR Code vazio');
    return '';
  }
  
  // Se já é data URL, retornar como está
  if (qrCode.startsWith('data:image/')) {
    console.log('[QR Normalize] ✅ Já é data URL');
    return qrCode;
  }
  
  // CORREÇÃO: Se é Base64 longo, adicionar prefixo data URL
  if (qrCode.length > 500 && !qrCode.includes(' ')) {
    const normalized = `data:image/png;base64,${qrCode}`;
    console.log('[QR Normalize] ✅ Convertido Base64 para data URL:', {
      originalLength: qrCode.length,
      normalizedLength: normalized.length
    });
    return normalized;
  }
  
  // CORREÇÃO CRÍTICA: QR Code em formato TEXTO (retornar como está)
  console.log('[QR Normalize] ✅ QR Code em formato TEXTO da VPS');
  return qrCode;
};

// Teste de conectividade com token correto
export const testVPSConnectivity = async (): Promise<boolean> => {
  try {
    console.log('[VPS Test] 🔗 Testando conectividade VPS com default-token...');
    console.log('[VPS Test] 🔑 Token usado:', VPS_CONFIG.authToken);
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(5000)
    });
    
    const isConnected = response.ok;
    console.log('[VPS Test] 📊 Resultado do teste:', {
      url: `${VPS_CONFIG.baseUrl}/health`,
      status: response.status,
      isConnected,
      token: VPS_CONFIG.authToken
    });
    
    return isConnected;
  } catch (error: any) {
    console.error('[VPS Test] ❌ Falha na conectividade:', error.message);
    return false;
  }
};
