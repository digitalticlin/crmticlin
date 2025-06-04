
import { VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';
import { corsHeaders } from './config.ts';

export async function getQRCodeFromVPS(instanceId: string) {
  try {
    console.log(`[QR Service] 📱 Obtendo QR Code para instância: ${instanceId}`);
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[QR Service] ✅ QR Code obtido com sucesso para ${instanceId}`);
      
      // Validar se é QR Code real
      if (data.qrCode && data.qrCode.startsWith('data:image/')) {
        const base64Part = data.qrCode.split(',')[1];
        if (base64Part && base64Part.length > 500) {
          console.log(`[QR Service] 🔍 QR Code REAL validado - Tamanho: ${base64Part.length} chars`);
          return {
            success: true,
            qrCode: data.qrCode,
            status: data.status || 'waiting_scan',
            timestamp: new Date().toISOString()
          };
        }
      }
      
      console.log(`[QR Service] ⚠️ QR Code inválido ou falso recebido`);
      return {
        success: false,
        error: 'QR Code inválido recebido da VPS'
      };
    } else {
      const errorText = await response.text();
      console.error(`[QR Service] ❌ Erro VPS: ${response.status} - ${errorText}`);
      throw new Error(`VPS QR request failed: ${response.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('[QR Service] 💥 Erro ao obter QR Code:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function updateQRCodeInDatabase(supabase: any, instanceId: string, qrCodeData: any) {
  try {
    console.log(`[QR Service] 💾 Atualizando QR Code no banco para: ${instanceId}`);
    
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: qrCodeData.qrCode,
        web_status: qrCodeData.status,
        connection_status: 'connecting',
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[QR Service] ❌ Erro ao atualizar banco:', error);
      throw error;
    }

    console.log('[QR Service] ✅ QR Code atualizado no banco com sucesso');
    return { success: true };

  } catch (error) {
    console.error('[QR Service] 💥 Erro na atualização do banco:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
