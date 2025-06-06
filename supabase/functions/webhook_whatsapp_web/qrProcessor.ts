
export async function processQRUpdate(supabase: any, instance: any, qrData: any) {
  console.log('[QR Processor] 📱 Processando atualização de QR:', qrData);
  
  try {
    const { qrCode } = qrData;
    
    if (!qrCode) {
      console.log('[QR Processor] ⚠️ QR Code vazio');
      return {
        success: true,
        processed: false
      };
    }

    // CORREÇÃO: Atualizar QR code no banco usando vps_instance_id
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: qrCode,
        web_status: 'waiting_scan',
        connection_status: 'waiting_scan',
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instance.vps_instance_id);

    if (updateError) {
      console.error('[QR Processor] ❌ Erro ao atualizar QR:', updateError);
      return {
        success: false,
        error: updateError.message
      };
    }

    console.log('[QR Processor] ✅ QR Code salvo automaticamente no banco via webhook');

    // NOVO: Também salvar na VPS localmente para sincronização
    try {
      const vpsResponse = await fetch(`http://31.97.24.222:3001/instance/${instance.vps_instance_id}/save-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer default-token`
        },
        body: JSON.stringify({
          qrCode: qrCode
        })
      });

      if (vpsResponse.ok) {
        console.log('[QR Processor] ✅ QR Code também salvo na VPS');
      } else {
        console.warn('[QR Processor] ⚠️ Falha ao salvar QR na VPS, mas banco foi atualizado');
      }
    } catch (vpsError) {
      console.warn('[QR Processor] ⚠️ Erro ao comunicar com VPS:', vpsError);
      // Não falhamos aqui pois o importante é ter salvo no banco
    }

    return {
      success: true,
      qrCode: qrCode,
      status: 'waiting_scan'
    };

  } catch (error) {
    console.error('[QR Processor] ❌ Erro:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
