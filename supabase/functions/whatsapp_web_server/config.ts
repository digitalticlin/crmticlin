
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  token: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dc0b3'
};

export const getVPSHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${VPS_CONFIG.token}`
});

// ANÁLISE PROFUNDA: Função para testar conectividade
export const testVPSConnectivity = async (): Promise<boolean> => {
  console.log('[Config] 🔍 ANÁLISE PROFUNDA - Testando conectividade VPS:', VPS_CONFIG.baseUrl);
  
  try {
    // Teste 1: Health check
    const healthResponse = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (healthResponse.ok) {
      console.log('[Config] ✅ ANÁLISE PROFUNDA - Health check OK');
      return true;
    }
    
    // Teste 2: Root endpoint
    const rootResponse = await fetch(`${VPS_CONFIG.baseUrl}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (rootResponse.ok) {
      console.log('[Config] ✅ ANÁLISE PROFUNDA - Root endpoint OK');
      return true;
    }
    
    // Teste 3: Instâncias endpoint
    const instancesResponse = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(5000)
    });
    
    if (instancesResponse.ok) {
      console.log('[Config] ✅ ANÁLISE PROFUNDA - Instances endpoint OK');
      return true;
    }
    
    console.warn('[Config] ⚠️ ANÁLISE PROFUNDA - Nenhum endpoint respondeu');
    return false;
    
  } catch (error: any) {
    console.error('[Config] ❌ ANÁLISE PROFUNDA - Erro de conectividade:', error.message);
    return false;
  }
};

// ANÁLISE PROFUNDA: Função para validar se é QR Code real
export const isRealQRCode = (qrData: string): boolean => {
  if (!qrData || typeof qrData !== 'string') {
    console.log('[Config] ❌ ANÁLISE PROFUNDA - QR inválido: não é string');
    return false;
  }
  
  // QR Code real deve ter pelo menos 100 caracteres e começar com padrão específico
  if (qrData.length < 100) {
    console.log('[Config] ❌ ANÁLISE PROFUNDA - QR muito curto:', qrData.length);
    return false;
  }
  
  // QR Code do WhatsApp geralmente contém esses padrões
  const whatsappPatterns = ['whatsapp', '@c.us', '@g.us', '1@'];
  const hasWhatsAppPattern = whatsappPatterns.some(pattern => 
    qrData.toLowerCase().includes(pattern)
  );
  
  console.log('[Config] 🔍 ANÁLISE PROFUNDA - QR Code válido:', {
    length: qrData.length,
    hasWhatsAppPattern,
    preview: qrData.substring(0, 50)
  });
  
  return hasWhatsAppPattern || qrData.length > 200; // QR Code costuma ser longo
};

// CORREÇÃO CRÍTICA: Adicionar função normalizeQRCode que estava faltando
export const normalizeQRCode = (qrData: any): string | null => {
  console.log('[Config] 🔧 ANÁLISE PROFUNDA - Normalizando QR Code:', typeof qrData);
  
  if (!qrData) {
    console.log('[Config] ❌ ANÁLISE PROFUNDA - QR Data é null/undefined');
    return null;
  }
  
  // Se já é uma string, retorna diretamente
  if (typeof qrData === 'string') {
    console.log('[Config] ✅ ANÁLISE PROFUNDA - QR Code já é string, tamanho:', qrData.length);
    return isRealQRCode(qrData) ? qrData : null;
  }
  
  // Se é um objeto com propriedade qrCode
  if (qrData.qrCode && typeof qrData.qrCode === 'string') {
    console.log('[Config] ✅ ANÁLISE PROFUNDA - QR Code extraído do objeto, tamanho:', qrData.qrCode.length);
    return isRealQRCode(qrData.qrCode) ? qrData.qrCode : null;
  }
  
  // Se é um objeto com propriedade qr
  if (qrData.qr && typeof qrData.qr === 'string') {
    console.log('[Config] ✅ ANÁLISE PROFUNDA - QR Code extraído como "qr", tamanho:', qrData.qr.length);
    return isRealQRCode(qrData.qr) ? qrData.qr : null;
  }
  
  // Se é um objeto com propriedade code
  if (qrData.code && typeof qrData.code === 'string') {
    console.log('[Config] ✅ ANÁLISE PROFUNDA - QR Code extraído como "code", tamanho:', qrData.code.length);
    return isRealQRCode(qrData.code) ? qrData.code : null;
  }
  
  console.log('[Config] ❌ ANÁLISE PROFUNDA - Formato de QR Code não reconhecido:', Object.keys(qrData || {}));
  return null;
};
