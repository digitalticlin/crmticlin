
import { VPS_CONFIG, getVPSHeaders, isRealQRCode } from './config.ts';
import { makeVPSRequest } from './vpsRequestService.ts';

export async function waitForQRCode(vpsInstanceId: string, maxAttempts = 6, delayMs = 5000): Promise<string | null> {
  console.log(`[QR Polling] 🔄 Iniciando polling para QR Code: ${vpsInstanceId}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[QR Polling] Tentativa ${attempt}/${maxAttempts} para obter QR Code`);
      
      const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
        method: 'POST',
        headers: getVPSHeaders(),
        body: JSON.stringify({ instanceId: vpsInstanceId })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.qrCode && isRealQRCode(data.qrCode)) {
          console.log(`[QR Polling] ✅ QR Code REAL obtido na tentativa ${attempt}`);
          return data.qrCode;
        } else {
          console.log(`[QR Polling] ⏳ QR Code ainda não disponível (tentativa ${attempt})`);
        }
      } else {
        console.log(`[QR Polling] ⚠️ Erro na tentativa ${attempt}: ${response.status}`);
      }
      
      // Aguardar antes da próxima tentativa (exceto na última)
      if (attempt < maxAttempts) {
        console.log(`[QR Polling] 😴 Aguardando ${delayMs}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
    } catch (error) {
      console.error(`[QR Polling] ❌ Erro na tentativa ${attempt}:`, error);
    }
  }
  
  console.log(`[QR Polling] ⏰ Timeout após ${maxAttempts} tentativas - QR Code será obtido posteriormente`);
  return null;
}

export async function updateQRCodeInDatabase(supabase: any, instanceId: string, qrCode: string): Promise<boolean> {
  try {
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({ 
        qr_code: qrCode,
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
