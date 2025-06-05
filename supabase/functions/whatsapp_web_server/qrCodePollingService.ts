import { VPS_CONFIG, getVPSHeaders, isRealQRCode } from './config.ts';
import { makeVPSRequest } from './vpsRequestService.ts';

export async function waitForQRCode(vpsInstanceId: string, maxAttempts = 8, delayMs = 1500): Promise<string | null> {
  console.log(`[QR Polling] 🔄 Iniciando polling ULTRA-RÁPIDO para QR Code: ${vpsInstanceId}`);
  console.log(`[QR Polling] 📊 Configuração ULTRA-RÁPIDA: ${maxAttempts} tentativas, ${delayMs}ms intervalo`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[QR Polling] ⚡ Tentativa ULTRA-RÁPIDA ${attempt}/${maxAttempts} para obter QR Code`);
      
      const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
        method: 'POST',
        headers: getVPSHeaders(),
        body: JSON.stringify({ instanceId: vpsInstanceId })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[QR Polling] 📥 Resposta VPS ULTRA-RÁPIDA (tentativa ${attempt}):`, {
          hasQrCode: !!data.qrCode,
          qrCodeLength: data.qrCode?.length || 0,
          status: data.status
        });
        
        if (data.qrCode && isRealQRCode(data.qrCode)) {
          console.log(`[QR Polling] ✅ QR Code REAL obtido ULTRA-RAPIDAMENTE na tentativa ${attempt}!`);
          console.log(`[QR Polling] 📏 Tamanho do QR Code: ${data.qrCode.length} caracteres`);
          return data.qrCode;
        } else {
          console.log(`[QR Polling] ⏳ QR Code ainda não disponível (tentativa ${attempt}) - POLLING ULTRA-RÁPIDO...`);
        }
      } else {
        const errorText = await response.text();
        console.log(`[QR Polling] ⚠️ Erro VPS na tentativa ${attempt}: ${response.status} - ${errorText}`);
        
        // Se é 404 e contém mensagem de "ainda não foi gerado", continuar tentando
        if (response.status === 404 && (errorText.includes('ainda não foi gerado') || errorText.includes('inicializando'))) {
          console.log(`[QR Polling] 🔄 VPS ainda inicializando - continuando polling ULTRA-RÁPIDO...`);
        }
      }
      
      // OTIMIZAÇÃO ULTRA-RÁPIDA: Polling progressivo mais agressivo
      if (attempt < maxAttempts) {
        let adaptiveDelay;
        if (attempt <= 3) {
          adaptiveDelay = delayMs; // Primeiras 3: 1.5s
        } else if (attempt <= 6) {
          adaptiveDelay = delayMs + 500; // Tentativas 4-6: 2s
        } else {
          adaptiveDelay = delayMs + 1000; // Últimas: 2.5s
        }
        
        console.log(`[QR Polling] 😴 Aguardando ULTRA-RÁPIDO ${adaptiveDelay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, adaptiveDelay));
      }
      
    } catch (error) {
      console.error(`[QR Polling] ❌ Erro na tentativa ${attempt}:`, error);
      
      // OTIMIZAÇÃO: Para erros de rede, aguardar menos tempo - 1s fixo
      if (attempt < maxAttempts) {
        const backoffDelay = 1000; // 1 segundo fixo para retry
        console.log(`[QR Polling] 🔄 Aplicando backoff ULTRA-RÁPIDO: ${backoffDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  console.log(`[QR Polling] ⏰ Timeout ULTRA-RÁPIDO após ${maxAttempts} tentativas - QR Code não obtido`);
  return null;
}

export async function updateQRCodeInDatabase(supabase: any, instanceId: string, qrCode: string): Promise<boolean> {
  try {
    console.log(`[QR Polling] 💾 Atualizando QR Code no banco - Instance ID: ${instanceId}`);
    console.log(`[QR Polling] 📏 QR Code tamanho: ${qrCode.length} caracteres`);
    
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({ 
        qr_code: qrCode,
        web_status: 'waiting_scan',
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    if (updateError) {
      console.error('[QR Polling] ⚠️ Erro ao atualizar QR Code no banco:', updateError);
      return false;
    } else {
      console.log('[QR Polling] ✅ QR Code atualizado no banco com sucesso');
      return true;
    }
  } catch (updateError) {
    console.error('[QR Polling] ⚠️ Erro na atualização do banco:', updateError);
    return false;
  }
}
