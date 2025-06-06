
import { createVPSRequest } from './vpsRequestService.ts';

interface StatusSyncResult {
  success: boolean;
  data?: {
    syncId: string;
    webhooksConfigured: number;
    statusUpdated: number;
    processedCount: number;
    errorCount: number;
    syncLog: string[];
  };
  error?: string;
}

export async function syncStatusAndWebhooks(supabase: any): Promise<StatusSyncResult> {
  console.log('[Status Sync] 🔧 Iniciando sincronização de status e configuração de webhooks');
  
  try {
    const syncId = `status-sync-${Date.now()}`;
    const syncLog: string[] = [];
    let webhooksConfigured = 0;
    let statusUpdated = 0;
    let processedCount = 0;
    let errorCount = 0;

    // 1. Configurar webhook global na VPS
    console.log('[Status Sync] 🔗 Configurando webhook global na VPS...');
    syncLog.push('Configurando webhook global na VPS');
    
    try {
      const webhookConfig = {
        webhookUrl: `https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web`,
        events: ['connection.update', 'qr.generate', 'message.receive']
      };

      const webhookResult = await createVPSRequest('/webhook/configure', 'POST', webhookConfig);
      
      if (webhookResult.success) {
        webhooksConfigured = 1;
        syncLog.push('✅ Webhook global configurado com sucesso');
        console.log('[Status Sync] ✅ Webhook global configurado:', webhookResult.data);
      } else {
        syncLog.push(`⚠️ Erro ao configurar webhook: ${webhookResult.error}`);
        console.warn('[Status Sync] ⚠️ Erro ao configurar webhook:', webhookResult.error);
        errorCount++;
      }
    } catch (webhookError) {
      syncLog.push(`❌ Falha crítica no webhook: ${webhookError.message}`);
      console.error('[Status Sync] ❌ Falha crítica no webhook:', webhookError);
      errorCount++;
    }

    // 2. Buscar todas as instâncias da VPS
    console.log('[Status Sync] 📋 Buscando instâncias da VPS...');
    syncLog.push('Buscando instâncias da VPS');
    
    const vpsInstancesResult = await createVPSRequest('/instances', 'GET');
    
    if (!vpsInstancesResult.success) {
      throw new Error(`Erro ao buscar instâncias da VPS: ${vpsInstancesResult.error}`);
    }

    const vpsInstances = vpsInstancesResult.data?.instances || [];
    processedCount = vpsInstances.length;
    
    console.log('[Status Sync] 📊 Instâncias encontradas na VPS:', processedCount);
    syncLog.push(`Encontradas ${processedCount} instâncias na VPS`);

    // 3. Para cada instância conectada, atualizar status no Supabase
    for (const vpsInstance of vpsInstances) {
      try {
        console.log('[Status Sync] 🔄 Processando instância:', vpsInstance.instanceName);
        
        // Verificar se a instância está conectada na VPS
        if (vpsInstance.state === 'open' || vpsInstance.state === 'ready') {
          // Buscar instância correspondente no Supabase
          const { data: supabaseInstance, error: findError } = await supabase
            .from('whatsapp_instances')
            .select('id, connection_status, vps_instance_id')
            .eq('vps_instance_id', vpsInstance.instanceName)
            .single();

          if (findError && findError.code !== 'PGRST116') {
            console.error('[Status Sync] ❌ Erro ao buscar instância no Supabase:', findError);
            syncLog.push(`❌ Erro ao buscar ${vpsInstance.instanceName}: ${findError.message}`);
            errorCount++;
            continue;
          }

          if (supabaseInstance) {
            // Instância existe no Supabase - verificar se precisa atualizar status
            if (supabaseInstance.connection_status !== 'connected' && 
                supabaseInstance.connection_status !== 'ready' && 
                supabaseInstance.connection_status !== 'open') {
              
              console.log('[Status Sync] 📝 Atualizando status da instância:', vpsInstance.instanceName);
              
              const updateData = {
                connection_status: 'ready',
                web_status: 'ready',
                updated_at: new Date().toISOString(),
                date_connected: new Date().toISOString(),
                qr_code: null
              };

              // Adicionar dados do perfil se disponíveis
              if (vpsInstance.profileName) {
                updateData.profile_name = vpsInstance.profileName;
              }
              if (vpsInstance.phone) {
                updateData.phone = vpsInstance.phone;
              }

              const { error: updateError } = await supabase
                .from('whatsapp_instances')
                .update(updateData)
                .eq('id', supabaseInstance.id);

              if (updateError) {
                console.error('[Status Sync] ❌ Erro ao atualizar status:', updateError);
                syncLog.push(`❌ Erro ao atualizar ${vpsInstance.instanceName}: ${updateError.message}`);
                errorCount++;
              } else {
                statusUpdated++;
                syncLog.push(`✅ Status atualizado: ${vpsInstance.instanceName} → ready`);
                console.log('[Status Sync] ✅ Status atualizado:', vpsInstance.instanceName);
              }
            } else {
              syncLog.push(`ℹ️ Status já correto: ${vpsInstance.instanceName}`);
            }
          } else {
            syncLog.push(`ℹ️ Instância não encontrada no Supabase: ${vpsInstance.instanceName}`);
          }
        } else {
          syncLog.push(`ℹ️ Instância não conectada na VPS: ${vpsInstance.instanceName} (${vpsInstance.state})`);
        }
      } catch (instanceError) {
        console.error('[Status Sync] ❌ Erro ao processar instância:', vpsInstance.instanceName, instanceError);
        syncLog.push(`❌ Erro ao processar ${vpsInstance.instanceName}: ${instanceError.message}`);
        errorCount++;
      }
    }

    // 4. Log da operação
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'sync_status_webhooks',
        status: errorCount === 0 ? 'success' : 'partial_success',
        result: {
          sync_id: syncId,
          webhooks_configured: webhooksConfigured,
          status_updated: statusUpdated,
          processed_count: processedCount,
          error_count: errorCount,
          sync_log: syncLog
        }
      });

    console.log('[Status Sync] ✅ Sincronização concluída:', {
      webhooksConfigured,
      statusUpdated,
      processedCount,
      errorCount
    });

    return {
      success: true,
      data: {
        syncId,
        webhooksConfigured,
        statusUpdated,
        processedCount,
        errorCount,
        syncLog
      }
    };

  } catch (error) {
    console.error('[Status Sync] ❌ Erro na sincronização:', error);
    
    // Log do erro
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'sync_status_webhooks',
        status: 'error',
        error_message: error.message,
        result: {
          error_at: new Date().toISOString()
        }
      });

    return {
      success: false,
      error: error.message
    };
  }
}
