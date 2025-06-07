
export async function processQRUpdateV3(supabase: any, instance: any, qrData: any) {
  const processId = `qr_proc_v3_${Date.now()}`;
  console.log(`[QR Processor V3] 📱 Processando QR Update CORRETO [${processId}]:`, {
    instanceId: instance.id,
    instanceName: instance.instance_name,
    vpsInstanceId: instance.vps_instance_id,
    hasQrCode: !!qrData.qrCode
  });
  
  try {
    const { qrCode } = qrData;
    
    if (!qrCode) {
      console.log(`[QR Processor V3] ⚠️ QR Code vazio [${processId}]`);
      return {
        success: true,
        processed: false,
        message: 'QR Code vazio'
      };
    }

    // CORREÇÃO: Normalizar QR Code para data URL format
    let normalizedQrCode = qrCode;
    if (!qrCode.startsWith('data:image/')) {
      normalizedQrCode = `data:image/png;base64,${qrCode}`;
    }

    console.log(`[QR Processor V3] 💾 Salvando QR Code normalizado [${processId}]:`, {
      qrCodeLength: normalizedQrCode.length,
      instanceId: instance.id,
      vpsInstanceId: instance.vps_instance_id,
      isDataUrl: normalizedQrCode.startsWith('data:image/')
    });

    // CORREÇÃO: Salvar QR Code no banco usando ID da instância com status correto
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: normalizedQrCode,
        web_status: 'waiting_scan',
        connection_status: 'connecting',
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    if (updateError) {
      console.error(`[QR Processor V3] ❌ Erro ao salvar QR [${processId}]:`, updateError);
      return {
        success: false,
        error: updateError.message,
        processId
      };
    }

    console.log(`[QR Processor V3] ✅ QR Code salvo com sucesso [${processId}]`);

    // Log de sucesso para tracking
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'process_qr_update_v3',
        status: 'success',
        result: {
          processId,
          instanceId: instance.id,
          vpsInstanceId: instance.vps_instance_id,
          qrCodeLength: normalizedQrCode.length,
          normalized: true,
          timestamp: new Date().toISOString()
        }
      });

    return {
      success: true,
      processed: true,
      qrCode: normalizedQrCode,
      status: 'waiting_scan',
      processId,
      message: 'QR Code processado e salvo com sucesso (V3)'
    };

  } catch (error) {
    console.error(`[QR Processor V3] ❌ Erro geral [${processId}]:`, error);
    
    // Log do erro
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'process_qr_update_v3',
        status: 'error',
        error_message: error.message,
        result: {
          processId,
          instanceId: instance.id,
          vpsInstanceId: instance.vps_instance_id
        }
      });

    return {
      success: false,
      error: error.message,
      processId
    };
  }
}
