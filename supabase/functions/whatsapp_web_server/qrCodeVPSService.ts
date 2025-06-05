
import { VPS_CONFIG, getVPSHeaders, isRealQRCode, corsHeaders } from './config.ts';

async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[QR VPS] 🔄 Tentativa ${i + 1}/${retries} para: ${url}`);
      console.log(`[QR VPS] 📤 Headers:`, options.headers);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(20000), // 20 segundos timeout
      });
      
      console.log(`[QR VPS] 📥 Status: ${response.status} ${response.statusText}`);
      
      return response;
    } catch (error) {
      console.error(`[QR VPS] ❌ Erro (tentativa ${i + 1}):`, error);
      
      if (i === retries - 1) {
        throw error;
      }
      
      const delay = Math.pow(2, i) * 1000;
      console.log(`[QR VPS] ⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function fetchQRCodeFromVPS(vpsInstanceId: string) {
  console.log('[QR VPS] 🔄 Buscando QR Code na VPS...');
  
  try {
    const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId: vpsInstanceId })
    });

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error(`[QR VPS] ❌ VPS retornou erro: ${vpsResponse.status} - ${errorText}`);
      
      let errorMessage = `VPS retornou status ${vpsResponse.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        if (errorText.includes('ainda não foi gerado') || 
            errorText.includes('inicializando') ||
            errorText.includes('waiting_scan')) {
          console.log('[QR VPS] ⏳ QR Code ainda sendo gerado pela VPS (normal)');
          return {
            success: false,
            waiting: true,
            retryAfter: 10000,
            message: 'QR Code ainda sendo gerado. Tente novamente em alguns segundos.'
          };
        }
      } catch (parseError) {
        console.error('[QR VPS] ❌ Erro ao fazer parse do erro da VPS:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    const responseText = await vpsResponse.text();
    console.log('[QR VPS] 📥 VPS Raw Response:', responseText);
    
    try {
      const vpsData = JSON.parse(responseText);
      console.log('[QR VPS] 📋 VPS Parsed Data:', vpsData);
      
      if (vpsData.qrCode && isRealQRCode(vpsData.qrCode)) {
        console.log('[QR VPS] 🎉 QR Code REAL obtido da VPS');
        return {
          success: true,
          qrCode: vpsData.qrCode,
          status: vpsData.status || 'waiting_scan'
        };
      } else {
        console.log('[QR VPS] ⏳ QR Code ainda não está pronto na VPS');
        return {
          success: false,
          waiting: true,
          retryAfter: 10000,
          message: 'QR Code ainda sendo gerado. Tente novamente em alguns segundos.'
        };
      }
    } catch (parseError) {
      console.error('[QR VPS] ❌ Erro ao fazer parse da resposta VPS:', parseError);
      throw new Error(`VPS retornou resposta inválida: ${responseText}`);
    }

  } catch (fetchError) {
    console.error('[QR VPS] ❌ Erro na requisição VPS:', fetchError);
    throw new Error(`Erro na comunicação com VPS: ${fetchError.message}`);
  }
}
