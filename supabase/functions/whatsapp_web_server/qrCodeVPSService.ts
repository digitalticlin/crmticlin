
import { VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';

export async function fetchQRCodeFromVPS(vpsInstanceId: string) {
  console.log(`[QR VPS] 🌐 Fazendo requisição à VPS para obter QR Code: ${vpsInstanceId}`);
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId: vpsInstanceId })
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.qrCode && data.qrCode.length > 50) {
        console.log(`[QR VPS] ✅ QR Code REAL obtido da VPS (length: ${data.qrCode.length})`);
        return {
          success: true,
          qrCode: data.qrCode,
          status: data.status || 'waiting_scan'
        };
      } else {
        console.log(`[QR VPS] ⏳ QR Code ainda não disponível na VPS`);
        return {
          success: false,
          waiting: true,
          retryAfter: 10000,
          message: 'QR Code ainda sendo gerado na VPS'
        };
      }
    } else {
      const errorText = await response.text();
      console.error(`[QR VPS] ❌ Erro HTTP da VPS:`, response.status, errorText);
      return {
        success: false,
        error: `Erro da VPS: ${response.status} - ${errorText}`,
        retryAfter: 15000
      };
    }

  } catch (error: any) {
    console.error(`[QR VPS] 💥 Erro ao buscar QR Code na VPS:`, error);
    return {
      success: false,
      error: `Erro de conectividade com VPS: ${error.message}`,
      retryAfter: 20000
    };
  }
}
