
export async function processQRUpdateV2(supabase: any, instance: any, qrData: any) {
  const processId = `qr_proc_v2_${Date.now()}`;
  console.log(`[QR Processor V2] 📱 Processando QR Update melhorado [${processId}]:`, {
    instanceId: instance.id,
    instanceName: instance.instance_name,
    vpsInstanceId: instance.vps_instance_id,
    hasQrCode: !!qrData.qrCode
  });
  
  try {
    const { qrCode } = qrData;
    
    if (!qrCode) {
      console.log(`[QR Processor V2] ⚠️ QR Code vazio [${processId}]`);
      return {
        success: true,
        processed: false,
        message: 'QR Code vazio'
      };
    }

    console.log(`[QR Processor V2] 💾 Salvando QR Code [${processId}]:`, {
      qrCodeLength: qrCode.length,
      instanceId: instance.id,
      vpsInstanceId: instance.vps_instance_id
    });

    // CORREÇÃO: Salvar QR Code no banco usando ID da instância
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: qrCode,
        web_status: 'waiting_scan',
        connection_status: 'waiting_scan',
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id); // Usar ID da instância, não vps_instance_id

    if (updateError) {
      console.error(`[QR Processor V2] ❌ Erro ao salvar QR [${processId}]:`, updateError);
      return {
        success: false,
        error: updateError.message,
        processId
      };
    }

    console.log(`[QR Processor V2] ✅ QR Code salvo com sucesso [${processId}]`);

    // Log de sucesso para tracking
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'process_qr_update_v2',
        status: 'success',
        result: {
          processId,
          instanceId: instance.id,
          vpsInstanceId: instance.vps_instance_id,
          qrCodeLength: qrCode.length,
          timestamp: new Date().toISOString()
        }
      });

    // NOVO: Também salvar na VPS para sincronização (opcional)
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
        console.log(`[QR Processor V2] ✅ QR Code também salvo na VPS [${processId}]`);
      } else {
        console.warn(`[QR Processor V2] ⚠️ Falha ao salvar QR na VPS [${processId}], mas banco foi atualizado`);
      }
    } catch (vpsError) {
      console.warn(`[QR Processor V2] ⚠️ Erro ao comunicar com VPS [${processId}]:`, vpsError);
      // Não falhamos aqui pois o importante é ter salvo no banco
    }

    return {
      success: true,
      processed: true,
      qrCode: qrCode,
      status: 'waiting_scan',
      processId,
      message: 'QR Code processado e salvo com sucesso'
    };

  } catch (error) {
    console.error(`[QR Processor V2] ❌ Erro geral [${processId}]:`, error);
    
    // Log do erro
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'process_qr_update_v2',
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
