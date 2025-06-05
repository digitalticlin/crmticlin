
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

    // Atualizar QR code no banco
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

    console.log('[QR Processor] ✅ QR Code atualizado no banco');

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
