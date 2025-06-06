
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: 'default-token',
  timeout: 30000, // Aumentado para 30s
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

// CORREÇÃO SUPER SIMPLES: Validação para QR Code já em data URL
export const isRealQRCode = (qrCode: string): boolean => {
  if (!qrCode || typeof qrCode !== 'string') {
    console.log('[QR Validation] ❌ QR Code inválido: não é string ou está vazio');
    return false;
  }
  
  // Remover espaços em branco
  const trimmedQR = qrCode.trim();
  
  // CORREÇÃO SUPER SIMPLES: Se já é data URL, é válido
  if (trimmedQR.startsWith('data:image/')) {
    const isValid = trimmedQR.length > 100; // Data URL deve ter tamanho mínimo
    console.log('[QR Validation] ✅ Data URL QR Code válido:', { length: trimmedQR.length, isValid });
    return isValid;
  }
  
  // FALLBACK: Se não é data URL, pode ser texto que precisará ser convertido depois
  const hasValidContent = trimmedQR.length > 20 && 
                         !trimmedQR.toLowerCase().includes('error') && 
                         !trimmedQR.toLowerCase().includes('null') &&
                         !trimmedQR.toLowerCase().includes('undefined');
  
  if (hasValidContent) {
    console.log('[QR Validation] ⚠️ QR Code texto (será convertido):', trimmedQR.substring(0, 50));
    return true;
  }
  
  console.log('[QR Validation] ❌ QR Code inválido:', {
    length: trimmedQR.length,
    preview: trimmedQR.substring(0, 50)
  });
  return false;
};

// CORREÇÃO SUPER SIMPLES: Função simplificada - não precisa mais converter
export const convertTextQRToDataURL = async (qrText: string): Promise<string> => {
  console.log('[QR Convert] ⚠️ CORREÇÃO SUPER SIMPLES - VPS já envia data URL, não deveria chegar aqui');
  
  // Se chegou aqui, é porque a VPS enviou texto em vez de data URL
  // Usar API externa como fallback
  try {
    console.log('[QR Convert] 🌐 Usando API externa como fallback para texto da VPS');
    
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrText)}`;
    
    const response = await fetch(qrApiUrl);
    
    if (!response.ok) {
      throw new Error(`API QR Code falhou: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    
    const dataUrl = `data:image/png;base64,${base64}`;
    
    console.log('[QR Convert] ✅ Conversão bem-sucedida via API externa');
    return dataUrl;
    
  } catch (error) {
    console.error('[QR Convert] ❌ API externa falhou:', error);
    
    // PNG de 1x1 pixel transparente válido como último recurso
    const placeholderBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    return `data:image/png;base64,${placeholderBase64}`;
  }
};

// CORREÇÃO SUPER SIMPLES: Normalização agora é direta
export const normalizeQRCode = async (qrCode: string): Promise<string> => {
  if (!qrCode) {
    console.log('[QR Normalize] ❌ CORREÇÃO SUPER SIMPLES - QR Code vazio ou nulo');
    throw new Error('QR Code está vazio');
  }
  
  console.log('[QR Normalize] 🔄 CORREÇÃO SUPER SIMPLES - Iniciando normalização simples:', {
    type: typeof qrCode,
    length: qrCode.length,
    preview: qrCode.substring(0, 50)
  });
  
  const trimmedQR = qrCode.trim();
  
  // CORREÇÃO SUPER SIMPLES: Se já é data URL válido (VPS já enviou correto), retornar direto
  if (trimmedQR.startsWith('data:image/')) {
    console.log('[QR Normalize] ✅ CORREÇÃO SUPER SIMPLES - Já é data URL válido da VPS!');
    return trimmedQR;
  }
  
  // Se não é data URL, converter (fallback para casos antigos)
  if (isRealQRCode(trimmedQR)) {
    console.log('[QR Normalize] 🔄 CORREÇÃO SUPER SIMPLES - Convertendo texto para data URL...');
    try {
      const dataUrl = await convertTextQRToDataURL(trimmedQR);
      console.log('[QR Normalize] ✅ CORREÇÃO SUPER SIMPLES - Conversão bem-sucedida');
      return dataUrl;
    } catch (error) {
      console.error('[QR Normalize] ❌ CORREÇÃO SUPER SIMPLES - Falha na conversão:', error);
      return trimmedQR; // Retornar original como fallback
    }
  }
  
  console.log('[QR Normalize] ❌ CORREÇÃO SUPER SIMPLES - QR Code não reconhecido como válido');
  throw new Error('QR Code não possui formato válido para conversão');
};

// Teste de conectividade com logs melhorados
export const testVPSConnectivity = async (): Promise<boolean> => {
  try {
    console.log('[VPS Test] 🔗 CORREÇÃO SUPER SIMPLES - Testando conectividade...');
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(10000)
    });
    
    const isConnected = response.ok;
    console.log('[VPS Test] 📊 CORREÇÃO SUPER SIMPLES - Resultado:', { 
      status: response.status, 
      isConnected,
      url: `${VPS_CONFIG.baseUrl}/health`
    });
    
    return isConnected;
  } catch (error: any) {
    console.error('[VPS Test] ❌ CORREÇÃO SUPER SIMPLES - Falha:', error.message);
    return false;
  }
};
