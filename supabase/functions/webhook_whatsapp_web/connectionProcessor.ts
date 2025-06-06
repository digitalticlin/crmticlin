export async function processConnectionUpdate(supabase: any, instance: any, connectionData: any) {
  console.log('[Connection Processor] 🔗 Processando atualização de conexão:', connectionData);
  
  try {
    const { connection, isNewLogin } = connectionData;
    
    if (!connection) {
      console.warn('[Connection Processor] ⚠️ Dados de conexão ausentes');
      return {
        success: true,
        processed: false
      };
    }

    const { state } = connection;
    console.log(`[Connection Processor] 🔄 Estado da conexão: ${state}`);

    // Atualizar o status de conexão no banco de dados
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        connection_status: state,
        web_status: state,
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instance.vps_instance_id);

    if (updateError) {
      console.error('[Connection Processor] ❌ Erro ao atualizar status:', updateError);
      return {
        success: false,
        error: updateError.message
      };
    }

    console.log('[Connection Processor] ✅ Status de conexão atualizado no banco');

    // Lógica adicional para lidar com novos logins
    if (isNewLogin) {
      console.log('[Connection Processor] 🔐 Novo login detectado');
      // Implementar lógica adicional aqui, se necessário
    }
    
    return {
      success: true,
      processed: true,
      state: state
    };
  } catch (error) {
    console.error('[Connection Processor] ❌ Erro:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
