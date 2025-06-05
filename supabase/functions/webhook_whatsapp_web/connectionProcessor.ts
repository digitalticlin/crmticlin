
export async function processConnectionUpdate(supabase: any, instance: any, connectionData: any) {
  console.log('[Connection Processor] 🔌 Processando atualização de conexão:', connectionData);
  
  try {
    const { connection, lastDisconnect, qr } = connectionData;
    
    let newStatus = 'disconnected';
    let newWebStatus = 'disconnected';
    
    // Mapear status do WhatsApp Web.js para nosso formato
    if (connection === 'open') {
      newStatus = 'ready';
      newWebStatus = 'ready';
    } else if (connection === 'connecting') {
      newStatus = 'connecting';
      newWebStatus = 'connecting';
    } else if (connection === 'close') {
      newStatus = 'disconnected';
      newWebStatus = 'disconnected';
    }

    // Atualizar no banco
    const updateData: any = {
      connection_status: newStatus,
      web_status: newWebStatus,
      updated_at: new Date().toISOString()
    };

    // Se conectou, limpar QR code
    if (connection === 'open') {
      updateData.qr_code = null;
      updateData.date_connected = new Date().toISOString();
    }

    // Se desconectou, registrar data
    if (connection === 'close') {
      updateData.date_disconnected = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('vps_instance_id', instance.vps_instance_id);

    if (updateError) {
      console.error('[Connection Processor] ❌ Erro ao atualizar status:', updateError);
      return {
        success: false,
        error: updateError.message
      };
    }

    console.log('[Connection Processor] ✅ Status atualizado:', {
      connection_status: newStatus,
      web_status: newWebStatus
    });

    return {
      success: true,
      status: newStatus,
      web_status: newWebStatus
    };

  } catch (error) {
    console.error('[Connection Processor] ❌ Erro:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
