
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

    // 🆕 TRIGGER MELHORADO: Iniciar importação do histórico quando conectar
    if (connection === 'open') {
      console.log('[Connection Processor] 🚀 Instância conectada! Iniciando importação do histórico...');
      
      try {
        // 🆕 DELAY ANTES DA IMPORTAÇÃO - Dar tempo para a instância se estabilizar
        console.log('[Connection Processor] ⏱️ Aguardando 3 segundos para estabilizar conexão...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Chamar função para importar histórico de chats
        await triggerChatHistoryImport(supabase, instance);
      } catch (historyError) {
        console.error('[Connection Processor] ⚠️ Erro ao iniciar importação do histórico:', historyError);
        // Não falhar a atualização do status por conta do histórico
      }
    }

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

// 🆝 MELHORADA: Função para disparar importação do histórico
async function triggerChatHistoryImport(supabase: any, instance: any) {
  console.log('[History Import] 📚 Iniciando importação do histórico para instância:', instance.vps_instance_id);
  
  try {
    // Buscar dados completos da instância
    const { data: instanceData, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', instance.vps_instance_id)
      .single();

    if (instanceError || !instanceData) {
      throw new Error(`Instância não encontrada: ${instanceError?.message}`);
    }

    console.log('[History Import] 📋 Dados da instância encontrados:', {
      id: instanceData.id,
      name: instanceData.instance_name,
      company_id: instanceData.company_id
    });

    // 🆕 VALIDAÇÃO MELHORADA - Verificar se importação já foi feita recentemente
    const { data: recentImport } = await supabase
      .from('sync_logs')
      .select('created_at')
      .eq('function_name', 'auto_history_import_trigger')
      .eq('status', 'success')
      .contains('result', { vps_instance_id: instance.vps_instance_id })
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Última hora
      .single();

    if (recentImport) {
      console.log('[History Import] ⏭️ Importação já realizada recentemente, pulando...');
      return;
    }

    // Chamar edge function para importar histórico via VPS
    const { data: importResponse, error: importError } = await supabase.functions.invoke('whatsapp_web_server', {
      body: {
        action: 'import_chat_history',
        instanceData: {
          instanceId: instanceData.id,
          vpsInstanceId: instance.vps_instance_id,
          companyId: instanceData.company_id
        }
      }
    });

    if (importError) {
      throw new Error(`Erro ao chamar importação: ${importError.message}`);
    }

    console.log('[History Import] ✅ Importação iniciada com sucesso:', importResponse);

    // Log da operação para auditoria
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'auto_history_import_trigger',
        status: 'success',
        result: {
          instance_id: instanceData.id,
          vps_instance_id: instance.vps_instance_id,
          instance_name: instanceData.instance_name,
          company_id: instanceData.company_id,
          triggered_at: new Date().toISOString(),
          import_response: importResponse
        }
      });

  } catch (error) {
    console.error('[History Import] ❌ Erro na importação do histórico:', error);
    
    // Log do erro para auditoria
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'auto_history_import_trigger',
        status: 'error',
        error_message: error.message,
        result: {
          instance_vps_id: instance.vps_instance_id,
          error_at: new Date().toISOString()
        }
      });
    
    throw error;
  }
}
