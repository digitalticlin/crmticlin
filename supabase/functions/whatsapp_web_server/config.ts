
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

// CORREÇÃO CRÍTICA: Adicionar função normalizeQRCode que estava faltando
export const normalizeQRCode = (qrData: any): string | null => {
  console.log('[Config] 🔧 Normalizando QR Code:', typeof qrData);
  
  if (!qrData) {
    console.log('[Config] ❌ QR Data é null/undefined');
    return null;
  }
  
  // Se já é uma string, retorna diretamente
  if (typeof qrData === 'string') {
    console.log('[Config] ✅ QR Code já é string, tamanho:', qrData.length);
    return qrData;
  }
  
  // Se é um objeto com propriedade qrCode
  if (qrData.qrCode && typeof qrData.qrCode === 'string') {
    console.log('[Config] ✅ QR Code extraído do objeto, tamanho:', qrData.qrCode.length);
    return qrData.qrCode;
  }
  
  // Se é um objeto com propriedade qr
  if (qrData.qr && typeof qrData.qr === 'string') {
    console.log('[Config] ✅ QR Code extraído como "qr", tamanho:', qrData.qr.length);
    return qrData.qr;
  }
  
  // Se é um objeto com propriedade code
  if (qrData.code && typeof qrData.code === 'string') {
    console.log('[Config] ✅ QR Code extraído como "code", tamanho:', qrData.code.length);
    return qrData.code;
  }
  
  console.log('[Config] ❌ Formato de QR Code não reconhecido:', Object.keys(qrData));
  return null;
};
