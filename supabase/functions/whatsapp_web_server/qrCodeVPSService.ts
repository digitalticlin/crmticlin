
import { VPS_CONFIG, getVPSHeaders, isRealQRCode, corsHeaders } from './config.ts';

async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[QR VPS] 🔄 Tentativa ${i + 1}/${retries} para: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30 segundos timeout
      });
      
      console.log(`[QR VPS] 📥 Status: ${response.status} ${response.statusText}`);
      
      return response;
    } catch (error) {
      console.error(`[QR VPS] ❌ Erro (tentativa ${i + 1}):`, error);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Backoff exponencial mais agressivo para retry de rede
      const delay = Math.pow(2, i) * 2000; // 2s, 4s, 8s
      console.log(`[QR VPS] ⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function fetchQRCodeFromVPS(vpsInstanceId: string) {
  console.log('[QR VPS] 🔄 Buscando QR Code na VPS com validação corrigida...');
  
  try {
    const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId: vpsInstanceId })
    });

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error(`[QR VPS] ❌ VPS retornou erro: ${vpsResponse.status} - ${errorText}`);
      
      // CORREÇÃO: Tentar fallback para endpoint /instance/status se /instance/qr falhar
      if (vpsResponse.status === 404) {
        console.log('[QR VPS] 🔄 Tentando fallback para endpoint /instance/status...');
        
        try {
          const statusResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/status`, {
            method: 'POST',
            headers: getVPSHeaders(),
            body: JSON.stringify({ instanceId: vpsInstanceId })
          });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('[QR VPS] 📋 Status response data:', {
              hasQrCode: !!statusData.status?.qrCode,
              qrCodeLength: statusData.status?.qrCode?.length || 0,
              status: statusData.status?.connectionStatus
            });

            if (statusData.status?.qrCode && isRealQRCode(statusData.status.qrCode)) {
              console.log('[QR VPS] 🎉 QR Code obtido via FALLBACK do status endpoint');
              return {
                success: true,
                qrCode: statusData.status.qrCode,
                status: statusData.status.connectionStatus || 'waiting_scan',
                source: 'fallback_status_endpoint'
              };
            } else if (statusData.status?.qrCode && statusData.status.qrCode.startsWith('data:image/')) {
              // FALLBACK ADICIONAL: Se QR existe mas validação falha, ainda retornar
              console.log('[QR VPS] ⚠️ QR Code do status falhou na validação - retornando mesmo assim');
              return {
                success: true,
                qrCode: statusData.status.qrCode,
                status: statusData.status.connectionStatus || 'waiting_scan',
                source: 'fallback_status_endpoint_bypassed_validation',
                warning: 'QR Code pode não estar totalmente válido'
              };
            }
          }
        } catch (fallbackError) {
          console.error('[QR VPS] ❌ Erro no fallback status:', fallbackError);
        }
        
        // Se chegou até aqui, QR ainda não está pronto
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error && 
              (errorData.error.includes('ainda não foi gerado') || 
               errorData.error.includes('inicializando') ||
               errorData.error.includes('waiting_scan'))) {
            console.log('[QR VPS] ⏳ QR Code ainda sendo gerado pela VPS (esperado)');
            return {
              success: false,
              waiting: true,
              retryAfter: 5000,
              message: 'QR Code ainda sendo gerado. Continuando polling...'
            };
          }
        } catch (parseError) {
          console.error('[QR VPS] ❌ Erro ao fazer parse do erro da VPS:', parseError);
        }
      }
      
      throw new Error(`VPS retornou status ${vpsResponse.status}: ${errorText}`);
    }

    const responseText = await vpsResponse.text();
    console.log('[QR VPS] 📥 VPS Raw Response:', responseText.substring(0, 200) + '...');
    
    try {
      const vpsData = JSON.parse(responseText);
      console.log('[QR VPS] 📋 VPS Parsed Data:', {
        hasQrCode: !!vpsData.qrCode,
        qrCodeLength: vpsData.qrCode?.length || 0,
        status: vpsData.status,
        success: vpsData.success,
        validation: vpsData.validation
      });
      
      if (vpsData.qrCode && isRealQRCode(vpsData.qrCode)) {
        console.log('[QR VPS] 🎉 QR Code REAL obtido da VPS');
        console.log('[QR VPS] 📏 Tamanho: ', vpsData.qrCode.length, 'caracteres');
        return {
          success: true,
          qrCode: vpsData.qrCode,
          status: vpsData.status || 'waiting_scan',
          validation: vpsData.validation || 'passed'
        };
      } else if (vpsData.qrCode && vpsData.qrCode.startsWith('data:image/') && vpsData.validation === 'bypassed_for_compatibility') {
        // CORREÇÃO: Aceitar QR Code que passou pelo bypass da VPS
        console.log('[QR VPS] ⚠️ QR Code com validação bypass - aceitando para compatibilidade');
        return {
          success: true,
          qrCode: vpsData.qrCode,
          status: vpsData.status || 'waiting_scan',
          validation: 'bypassed_compatibility',
          warning: vpsData.warning
        };
      } else {
        console.log('[QR VPS] ⏳ QR Code ainda não está pronto na VPS');
        return {
          success: false,
          waiting: true,
          retryAfter: 5000,
          message: 'QR Code ainda sendo gerado. Continuando polling...'
        };
      }
    } catch (parseError) {
      console.error('[QR VPS] ❌ Erro ao fazer parse da resposta VPS:', parseError);
      throw new Error(`VPS retornou resposta inválida: ${responseText.substring(0, 100)}...`);
    }

  } catch (fetchError) {
    console.error('[QR VPS] ❌ Erro na requisição VPS:', fetchError);
    throw new Error(`Erro na comunicação com VPS: ${fetchError.message}`);
  }
}
