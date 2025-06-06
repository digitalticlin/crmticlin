
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

// CORREÇÃO CRÍTICA: Validação melhorada para QR Code
export const isRealQRCode = (qrCode: string): boolean => {
  if (!qrCode || typeof qrCode !== 'string') {
    console.log('[QR Validation] ❌ QR Code inválido: não é string ou está vazio');
    return false;
  }
  
  // Remover espaços em branco
  const trimmedQR = qrCode.trim();
  
  // Aceitar data URLs (imagens)
  if (trimmedQR.startsWith('data:image/')) {
    const isValid = trimmedQR.length > 100; // Data URL deve ter tamanho mínimo
    console.log('[QR Validation] 📊 Data URL validation:', { length: trimmedQR.length, isValid });
    return isValid;
  }
  
  // CORREÇÃO: Aceitar QR Code em formato texto válido (como o da VPS)
  const hasValidContent = trimmedQR.length > 20 && 
                         !trimmedQR.toLowerCase().includes('error') && 
                         !trimmedQR.toLowerCase().includes('null') &&
                         !trimmedQR.toLowerCase().includes('undefined') &&
                         // QR Code válido da VPS tem este padrão específico
                         (trimmedQR.includes('@') || trimmedQR.includes(',') || trimmedQR.includes('='));
  
  if (hasValidContent) {
    console.log('[QR Validation] ✅ QR Code texto válido:', trimmedQR.substring(0, 50));
    return true;
  }
  
  console.log('[QR Validation] ❌ QR Code inválido:', {
    length: trimmedQR.length,
    preview: trimmedQR.substring(0, 50),
    hasAt: trimmedQR.includes('@'),
    hasComma: trimmedQR.includes(','),
    hasEquals: trimmedQR.includes('=')
  });
  return false;
};

// CORREÇÃO CRÍTICA: Função simplificada que funciona no Edge Runtime
export const convertTextQRToDataURL = async (qrText: string): Promise<string> => {
  try {
    console.log('[QR Convert] 🔄 CORREÇÃO CRÍTICA - Convertendo QR Text para Data URL');
    console.log('[QR Convert] 📊 Input QR:', { length: qrText.length, preview: qrText.substring(0, 100) });
    
    // ESTRATÉGIA SIMPLIFICADA: Usar API externa para gerar QR Code
    try {
      console.log('[QR Convert] 🌐 Usando API externa para gerar QR Code');
      
      // Usar um serviço público de QR Code
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrText)}`;
      
      // Fazer requisição para obter a imagem
      const response = await fetch(qrApiUrl);
      
      if (!response.ok) {
        throw new Error(`API QR Code falhou: ${response.status}`);
      }
      
      // Converter para base64
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Converter para base64
      let binary = '';
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);
      
      const dataUrl = `data:image/png;base64,${base64}`;
      
      console.log('[QR Convert] ✅ Conversão bem-sucedida via API externa');
      return dataUrl;
      
    } catch (apiError) {
      console.error('[QR Convert] ❌ API externa falhou:', apiError);
      
      // FALLBACK: Retornar uma imagem placeholder válida
      console.log('[QR Convert] 🔄 Usando placeholder como fallback');
      
      // PNG de 1x1 pixel transparente válido
      const placeholderBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      return `data:image/png;base64,${placeholderBase64}`;
    }
    
  } catch (error) {
    console.error('[QR Convert] ❌ CORREÇÃO CRÍTICA - Falha total na conversão:', error);
    throw new Error(`Falha crítica na conversão do QR Code: ${error.message}`);
  }
};

// CORREÇÃO CRÍTICA: Normalização robusta com múltiplas verificações
export const normalizeQRCode = async (qrCode: string): Promise<string> => {
  if (!qrCode) {
    console.log('[QR Normalize] ❌ CORREÇÃO CRÍTICA - QR Code vazio ou nulo');
    throw new Error('QR Code está vazio');
  }
  
  console.log('[QR Normalize] 🔄 CORREÇÃO CRÍTICA - Iniciando normalização robusta:', {
    type: typeof qrCode,
    length: qrCode.length,
    preview: qrCode.substring(0, 50)
  });
  
  const trimmedQR = qrCode.trim();
  
  // Se já é data URL válido, retornar
  if (trimmedQR.startsWith('data:image/')) {
    console.log('[QR Normalize] ✅ CORREÇÃO CRÍTICA - Já é data URL válido');
    return trimmedQR;
  }
  
  // Se é Base64 sem prefixo, adicionar
  if (trimmedQR.length > 500 && !trimmedQR.includes(' ') && !trimmedQR.includes('@') && !trimmedQR.includes('.')) {
    const normalized = `data:image/png;base64,${trimmedQR}`;
    console.log('[QR Normalize] ✅ CORREÇÃO CRÍTICA - Base64 convertido para data URL');
    return normalized;
  }
  
  // CORREÇÃO: Se é conteúdo texto do QR Code da VPS, converter para imagem
  if (isRealQRCode(trimmedQR)) {
    console.log('[QR Normalize] 🔄 CORREÇÃO CRÍTICA - Convertendo texto QR da VPS para imagem...');
    try {
      const dataUrl = await convertTextQRToDataURL(trimmedQR);
      console.log('[QR Normalize] ✅ CORREÇÃO CRÍTICA - Conversão bem-sucedida');
      return dataUrl;
    } catch (error) {
      console.error('[QR Normalize] ❌ CORREÇÃO CRÍTICA - Falha na conversão:', error);
      // FALLBACK: Retornar o texto original e deixar o frontend lidar
      console.log('[QR Normalize] 🔄 Usando texto original como fallback');
      return trimmedQR;
    }
  }
  
  console.log('[QR Normalize] ❌ CORREÇÃO CRÍTICA - QR Code não reconhecido como válido');
  throw new Error('QR Code não possui formato válido para conversão');
};

// Teste de conectividade com logs melhorados
export const testVPSConnectivity = async (): Promise<boolean> => {
  try {
    console.log('[VPS Test] 🔗 CORREÇÃO CRÍTICA - Testando conectividade...');
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(10000)
    });
    
    const isConnected = response.ok;
    console.log('[VPS Test] 📊 CORREÇÃO CRÍTICA - Resultado:', { 
      status: response.status, 
      isConnected,
      url: `${VPS_CONFIG.baseUrl}/health`
    });
    
    return isConnected;
  } catch (error: any) {
    console.error('[VPS Test] ❌ CORREÇÃO CRÍTICA - Falha:', error.message);
    return false;
  }
};
