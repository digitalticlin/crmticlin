
import { VPS_CONFIG, getVPSHeaders, isRealQRCode } from './config.ts';
import { makeVPSRequest } from './vpsRequestService.ts';

export async function waitForQRCode(vpsInstanceId: string, maxAttempts = 12, delayMs = 3000): Promise<string | null> {
  console.log(`[QR Polling] 🔄 Iniciando polling melhorado para QR Code: ${vpsInstanceId}`);
  console.log(`[QR Polling] 📊 Configuração: ${maxAttempts} tentativas, ${delayMs}ms intervalo`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[QR Polling] 🎯 Tentativa ${attempt}/${maxAttempts} para obter QR Code`);
      
      const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
        method: 'POST',
        headers: getVPSHeaders(),
        body: JSON.stringify({ instanceId: vpsInstanceId })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[QR Polling] 📥 Resposta VPS (tentativa ${attempt}):`, {
          hasQrCode: !!data.qrCode,
          qrCodeLength: data.qrCode?.length || 0,
          status: data.status
        });
        
        if (data.qrCode && isRealQRCode(data.qrCode)) {
          console.log(`[QR Polling] ✅ QR Code REAL obtido na tentativa ${attempt}!`);
          console.log(`[QR Polling] 📏 Tamanho do QR Code: ${data.qrCode.length} caracteres`);
          return data.qrCode;
        } else {
          console.log(`[QR Polling] ⏳ QR Code ainda não disponível (tentativa ${attempt}) - aguardando...`);
        }
      } else {
        const errorText = await response.text();
        console.log(`[QR Polling] ⚠️ Erro VPS na tentativa ${attempt}: ${response.status} - ${errorText}`);
        
        // Se é 404 e contém mensagem de "ainda não foi gerado", continuar tentando
        if (response.status === 404 && (errorText.includes('ainda não foi gerado') || errorText.includes('inicializando'))) {
          console.log(`[QR Polling] 🔄 VPS ainda inicializando - continuando polling...`);
        }
      }
      
      // Aguardar antes da próxima tentativa (exceto na última)
      if (attempt < maxAttempts) {
        console.log(`[QR Polling] 😴 Aguardando ${delayMs}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
    } catch (error) {
      console.error(`[QR Polling] ❌ Erro na tentativa ${attempt}:`, error);
      
      // Para erros de rede, aguardar mais tempo antes de tentar novamente
      if (attempt < maxAttempts) {
        const backoffDelay = delayMs * Math.pow(1.5, attempt - 1); // Backoff exponencial suave
        console.log(`[QR Polling] 🔄 Aplicando backoff: ${backoffDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  console.log(`[QR Polling] ⏰ Timeout após ${maxAttempts} tentativas - QR Code não obtido`);
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
