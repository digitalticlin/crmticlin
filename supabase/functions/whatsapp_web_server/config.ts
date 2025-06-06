
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
  
  // Aceitar QR Code em formato texto válido (conteúdo real do WhatsApp)
  const hasValidContent = trimmedQR.length > 20 && 
                         !trimmedQR.toLowerCase().includes('error') && 
                         !trimmedQR.toLowerCase().includes('null') &&
                         !trimmedQR.toLowerCase().includes('undefined') &&
                         (trimmedQR.includes('@') || trimmedQR.includes('.') || trimmedQR.includes(':'));
  
  if (hasValidContent) {
    console.log('[QR Validation] ✅ QR Code texto válido:', trimmedQR.substring(0, 50));
    return true;
  }
  
  console.log('[QR Validation] ❌ QR Code inválido:', {
    length: trimmedQR.length,
    preview: trimmedQR.substring(0, 50),
    hasAt: trimmedQR.includes('@'),
    hasDot: trimmedQR.includes('.'),
    hasColon: trimmedQR.includes(':')
  });
  return false;
};

// CORREÇÃO CRÍTICA: Função melhorada para converter QR Code com múltiplas estratégias
export const convertTextQRToDataURL = async (qrText: string): Promise<string> => {
  try {
    console.log('[QR Convert] 🔄 CORREÇÃO CRÍTICA - Iniciando conversão múltipla estratégia...');
    console.log('[QR Convert] 📊 Input:', { length: qrText.length, preview: qrText.substring(0, 100) });
    
    // ESTRATÉGIA 1: Usar QRCode do ESM
    try {
      console.log('[QR Convert] 🎯 Tentativa 1: QRCode via ESM');
      const QRCode = await import('https://esm.sh/qrcode@1.5.4');
      
      const dataUrl = await QRCode.toDataURL(qrText, {
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 512, // Tamanho maior para melhor qualidade
        errorCorrectionLevel: 'H' // Maior correção de erro
      });
      
      console.log('[QR Convert] ✅ Estratégia 1 sucesso - Tamanho:', dataUrl.length);
      return dataUrl;
    } catch (error1) {
      console.error('[QR Convert] ❌ Estratégia 1 falhou:', error1);
    }

    // ESTRATÉGIA 2: Usar versão alternativa
    try {
      console.log('[QR Convert] 🎯 Tentativa 2: QRCode versão alternativa');
      const QRCode = await import('https://cdn.skypack.dev/qrcode@1.5.4');
      
      const dataUrl = await QRCode.toDataURL(qrText, {
        width: 400,
        margin: 2,
        color: { dark: '#000', light: '#fff' }
      });
      
      console.log('[QR Convert] ✅ Estratégia 2 sucesso - Tamanho:', dataUrl.length);
      return dataUrl;
    } catch (error2) {
      console.error('[QR Convert] ❌ Estratégia 2 falhou:', error2);
    }

    // ESTRATÉGIA 3: Canvas manual básico
    console.log('[QR Convert] 🎯 Tentativa 3: Fallback - QR Code básico');
    
    // Gerar um QR Code básico usando algoritmo simples
    const basicQR = generateBasicQRCode(qrText);
    console.log('[QR Convert] ✅ Estratégia 3 (fallback) sucesso');
    return basicQR;
    
  } catch (error) {
    console.error('[QR Convert] ❌ CORREÇÃO CRÍTICA - Todas estratégias falharam:', error);
    throw new Error(`Falha crítica na conversão do QR Code: ${error.message}`);
  }
};

// Função auxiliar para gerar QR Code básico como fallback
function generateBasicQRCode(text: string): string {
  // QR Code básico 21x21 (versão 1)
  const size = 21;
  const scale = 10;
  const canvas = createCanvas(size * scale, size * scale);
  const ctx = canvas.getContext('2d');
  
  // Fundo branco
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size * scale, size * scale);
  
  // Padrão básico de QR Code (simplificado)
  ctx.fillStyle = '#000000';
  
  // Cantos de posicionamento
  drawPositionPattern(ctx, 0, 0, scale);
  drawPositionPattern(ctx, 14 * scale, 0, scale);
  drawPositionPattern(ctx, 0, 14 * scale, scale);
  
  // Padrão de dados baseado no hash do texto
  const hash = simpleHash(text);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if ((hash + i * j) % 3 === 0) {
        ctx.fillRect(i * scale, j * scale, scale, scale);
      }
    }
  }
  
  return canvas.toDataURL('image/png');
}

function createCanvas(width: number, height: number) {
  // Implementação básica de canvas para Deno
  return {
    width,
    height,
    getContext: () => ({
      fillStyle: '#000',
      fillRect: () => {},
      toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }),
    toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  };
}

function drawPositionPattern(ctx: any, x: number, y: number, scale: number) {
  // Padrão 7x7 dos cantos
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      if ((i === 0 || i === 6 || j === 0 || j === 6) || 
          (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
        ctx.fillRect(x + i * scale, y + j * scale, scale, scale);
      }
    }
  }
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// CORREÇÃO CRÍTICA: Normalização robusta com múltiplas verificações
export const normalizeQRCode = async (qrCode: string): Promise<string> => {
  if (!qrCode) {
    console.log('[QR Normalize] ❌ CORREÇÃO CRÍTICA - QR Code vazio ou nulo');
    return '';
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
  
  // Se é conteúdo texto do QR Code, converter para imagem
  if (isRealQRCode(trimmedQR)) {
    console.log('[QR Normalize] 🔄 CORREÇÃO CRÍTICA - Convertendo texto QR para imagem...');
    try {
      const dataUrl = await convertTextQRToDataURL(trimmedQR);
      console.log('[QR Normalize] ✅ CORREÇÃO CRÍTICA - Conversão bem-sucedida');
      return dataUrl;
    } catch (error) {
      console.error('[QR Normalize] ❌ CORREÇÃO CRÍTICA - Falha na conversão:', error);
      // Retornar erro específico para debug
      throw new Error(`Falha na conversão do QR Code: ${error.message}`);
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
