
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001', // CORREÇÃO CRÍTICA: Alterado de 3002 para 3001
  authToken: 'default-token',
  timeout: 25000, // Aumentado de 20s para 25s
  endpoints: {
    createInstance: '/instance/create',
    deleteInstance: '/instance/delete', 
    getQR: '/instance/qr',
    getQRDirect: '/instance/{instanceId}/qr', // Endpoint que funciona
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

// CORREÇÃO: Função melhorada para validar QR Code real
export const isRealQRCode = (qrCode: string): boolean => {
  if (!qrCode || typeof qrCode !== 'string') {
    console.log('[QR Validation] ❌ QR Code inválido: não é string');
    return false;
  }
  
  // Verificar se é data URL válido
  if (qrCode.startsWith('data:image/')) {
    const base64Part = qrCode.split(',')[1];
    const isValid = base64Part && base64Part.length > 500;
    console.log('[QR Validation] 🔍 Data URL:', {
      hasBase64Part: !!base64Part,
      base64Length: base64Part ? base64Part.length : 0,
      isValid
    });
    return isValid;
  }
  
  // Verificar se é Base64 puro ou string de QR válida
  if (qrCode.length > 100) { // QR Code válido tem pelo menos 100 caracteres
    console.log('[QR Validation] ✅ QR Code válido:', qrCode.length);
    return true;
  }
  
  console.log('[QR Validation] ❌ QR Code muito pequeno:', qrCode.length);
  return false;
};

// CORREÇÃO: Normalizar formato do QR Code
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
  
  // Se é Base64 longo, adicionar prefixo data URL
  if (qrCode.length > 500) {
    const normalized = `data:image/png;base64,${qrCode}`;
    console.log('[QR Normalize] ✅ Convertido para data URL:', {
      originalLength: qrCode.length,
      normalizedLength: normalized.length
    });
    return normalized;
  }
  
  // QR Code em formato texto (retornar como está)
  console.log('[QR Normalize] ✅ QR Code em formato texto');
  return qrCode;
};

// CORREÇÃO: Função para testar conectividade da VPS com porta correta
export const testVPSConnectivity = async (): Promise<boolean> => {
  try {
    console.log('[VPS Test] 🔗 Testando conectividade da VPS na porta 3001...');
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(5000)
    });
    
    const isConnected = response.ok;
    console.log('[VPS Test] 📊 Resultado do teste:', {
      url: `${VPS_CONFIG.baseUrl}/health`,
      status: response.status,
      isConnected
    });
    
    return isConnected;
  } catch (error: any) {
    console.error('[VPS Test] ❌ Falha na conectividade:', error.message);
    return false;
  }
};
