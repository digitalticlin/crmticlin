
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

// CORREÇÃO ESTRATÉGICA: Validação robusta para QR Code
export const isRealQRCode = (qrCode: string): boolean => {
  if (!qrCode || typeof qrCode !== 'string') {
    console.log('[QR Validation] ❌ QR Code inválido: não é string');
    return false;
  }
  
  // Aceitar data URLs (imagens)
  if (qrCode.startsWith('data:image/')) {
    console.log('[QR Validation] ✅ QR Code válido (data URL):', qrCode.length);
    return true;
  }
  
  // Aceitar QR Code em formato texto da VPS (será convertido)
  if (qrCode.length > 10 && !qrCode.includes('Error') && !qrCode.includes('error') && !qrCode.includes('null')) {
    console.log('[QR Validation] ✅ QR Code válido (texto da VPS):', qrCode.length);
    return true;
  }
  
  console.log('[QR Validation] ❌ QR Code inválido:', qrCode.substring(0, 50));
  return false;
};

// CORREÇÃO ESTRATÉGICA: Função melhorada para converter QR Code texto em data URL
export const convertTextQRToDataURL = async (qrText: string): Promise<string> => {
  try {
    console.log('[QR Convert] 🔄 CORREÇÃO ESTRATÉGICA - Convertendo QR Code texto para data URL...');
    console.log('[QR Convert] 📊 QR Text (primeiros 100 chars):', qrText.substring(0, 100));
    
    // Importar biblioteca QRCode dinamicamente
    const QRCode = await import('https://esm.sh/qrcode@1.5.4');
    
    // Gerar QR Code como data URL com configurações otimizadas
    const dataUrl = await QRCode.toDataURL(qrText, {
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 400, // Aumentado para melhor qualidade
      errorCorrectionLevel: 'M'
    });
    
    console.log('[QR Convert] ✅ CORREÇÃO ESTRATÉGICA - QR Code convertido com sucesso, tamanho:', dataUrl.length);
    return dataUrl;
    
  } catch (error) {
    console.error('[QR Convert] ❌ CORREÇÃO ESTRATÉGICA - Erro na conversão:', error);
    throw new Error(`Falha na conversão do QR Code: ${error.message}`);
  }
};

// CORREÇÃO ESTRATÉGICA: Normalização melhorada com validação robusta
export const normalizeQRCode = async (qrCode: string): Promise<string> => {
  if (!qrCode) {
    console.log('[QR Normalize] ❌ CORREÇÃO ESTRATÉGICA - QR Code vazio');
    return '';
  }
  
  console.log('[QR Normalize] 🔄 CORREÇÃO ESTRATÉGICA - Iniciando normalização, tipo:', typeof qrCode, 'tamanho:', qrCode.length);
  
  // Se já é data URL, retornar como está
  if (qrCode.startsWith('data:image/')) {
    console.log('[QR Normalize] ✅ CORREÇÃO ESTRATÉGICA - Já é data URL');
    return qrCode;
  }
  
  // Se é Base64 longo, adicionar prefixo data URL
  if (qrCode.length > 500 && !qrCode.includes(' ') && !qrCode.includes('@')) {
    const normalized = `data:image/png;base64,${qrCode}`;
    console.log('[QR Normalize] ✅ CORREÇÃO ESTRATÉGICA - Convertido Base64 para data URL');
    return normalized;
  }
  
  // CORREÇÃO CRÍTICA: Se é texto QR da VPS, converter para imagem
  if (qrCode.length > 10 && (qrCode.includes('@') || qrCode.includes('.') || qrCode.includes(':'))) {
    console.log('[QR Normalize] 🔄 CORREÇÃO ESTRATÉGICA - Convertendo texto QR para data URL...');
    try {
      const dataUrl = await convertTextQRToDataURL(qrCode);
      console.log('[QR Normalize] ✅ CORREÇÃO ESTRATÉGICA - Texto QR convertido para data URL com sucesso');
      return dataUrl;
    } catch (error) {
      console.error('[QR Normalize] ❌ CORREÇÃO ESTRATÉGICA - Falha na conversão:', error);
      return '';
    }
  }
  
  console.log('[QR Normalize] ⚠️ CORREÇÃO ESTRATÉGICA - Formato QR não reconhecido:', qrCode.substring(0, 50));
  return qrCode;
};

// Teste de conectividade com token correto
export const testVPSConnectivity = async (): Promise<boolean> => {
  try {
    console.log('[VPS Test] 🔗 Testando conectividade VPS...');
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(5000)
    });
    
    const isConnected = response.ok;
    console.log('[VPS Test] 📊 Resultado:', { status: response.status, isConnected });
    
    return isConnected;
  } catch (error: any) {
    console.error('[VPS Test] ❌ Falha na conectividade:', error.message);
    return false;
  }
};
