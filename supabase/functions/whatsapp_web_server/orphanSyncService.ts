
import { createVPSRequest } from './vpsRequestService.ts';

interface OrphanSyncResult {
  success: boolean;
  data?: {
    syncId: string;
    orphansImported: number;
    orphansUpdated: number;
    totalProcessed: number;
    errorCount: number;
    syncLog: string[];
  };
  error?: string;
}

export async function syncOrphanInstances(supabase: any): Promise<OrphanSyncResult> {
  console.log('[Orphan Sync] 👥 Iniciando sincronização de instâncias órfãs');
  
  try {
    const syncId = `orphan-sync-${Date.now()}`;
    const syncLog: string[] = [];
    let orphansImported = 0;
    let orphansUpdated = 0;
    let totalProcessed = 0;
    let errorCount = 0;

    // 1. Buscar todas as instâncias da VPS
    console.log('[Orphan Sync] 📋 Buscando instâncias da VPS...');
    syncLog.push('Buscando todas as instâncias da VPS');
    
    const vpsInstancesResult = await createVPSRequest('/instances', 'GET');
    
    if (!vpsInstancesResult.success) {
      throw new Error(`Erro ao buscar instâncias da VPS: ${vpsInstancesResult.error}`);
    }

    const vpsInstances = vpsInstancesResult.data?.instances || [];
    totalProcessed = vpsInstances.length;
    
    console.log('[Orphan Sync] 📊 Instâncias encontradas na VPS:', totalProcessed);
    syncLog.push(`Encontradas ${totalProcessed} instâncias na VPS`);

    // 2. Para cada instância da VPS, verificar se existe no Supabase
    for (const vpsInstance of vpsInstances) {
      try {
        console.log('[Orphan Sync] 🔍 Verificando instância:', vpsInstance.instanceName);
        
        // Buscar instância no Supabase
        const { data: existingInstance, error: findError } = await supabase
          .from('whatsapp_instances')
          .select('id, vps_instance_id, created_by_user_id')
          .eq('vps_instance_id', vpsInstance.instanceName)
          .single();

        if (findError && findError.code !== 'PGRST116') {
          console.error('[Orphan Sync] ❌ Erro ao buscar instância:', findError);
          syncLog.push(`❌ Erro ao buscar ${vpsInstance.instanceName}: ${findError.message}`);
          errorCount++;
          continue;
        }

        if (!existingInstance) {
          // Instância não existe no Supabase - criar como órfã
          console.log('[Orphan Sync] 🆕 Criando instância órfã:', vpsInstance.instanceName);
          
          const newInstanceData = {
            instance_name: vpsInstance.instanceName,
            vps_instance_id: vpsInstance.instanceName,
            connection_type: 'web',
            connection_status: vpsInstance.state || 'created',
            web_status: vpsInstance.state || 'created',
            created_by_user_id: null, // Órfã - sem usuário vinculado
            company_id: null,
            profile_name: vpsInstance.profileName || null,
            phone: vpsInstance.phone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Se a instância está conectada na VPS, marcar como conectada
          if (vpsInstance.state === 'open' || vpsInstance.state === 'ready') {
            newInstanceData.connection_status = 'ready';
            newInstanceData.web_status = 'ready';
            newInstanceData.date_connected = new Date().toISOString();
          }

          const { error: insertError } = await supabase
            .from('whatsapp_instances')
            .insert(newInstanceData);

          if (insertError) {
            console.error('[Orphan Sync] ❌ Erro ao criar instância órfã:', insertError);
            syncLog.push(`❌ Erro ao criar órfã ${vpsInstance.instanceName}: ${insertError.message}`);
            errorCount++;
          } else {
            orphansImported++;
            syncLog.push(`✅ Órfã importada: ${vpsInstance.instanceName}`);
            console.log('[Orphan Sync] ✅ Órfã criada:', vpsInstance.instanceName);
          }
        } else {
          // Instância existe - verificar se precisa atualizar dados
          let needsUpdate = false;
          const updateData: any = {
            updated_at: new Date().toISOString()
          };

          // Atualizar status se necessário
          if ((vpsInstance.state === 'open' || vpsInstance.state === 'ready') && 
              existingInstance.connection_status !== 'ready' && 
              existingInstance.connection_status !== 'connected') {
            updateData.connection_status = 'ready';
            updateData.web_status = 'ready';
            updateData.date_connected = new Date().toISOString();
            updateData.qr_code = null;
            needsUpdate = true;
          }

          // Atualizar perfil se disponível
          if (vpsInstance.profileName) {
            updateData.profile_name = vpsInstance.profileName;
            needsUpdate = true;
          }

          // Atualizar telefone se disponível
          if (vpsInstance.phone) {
            updateData.phone = vpsInstance.phone;
            needsUpdate = true;
          }

          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from('whatsapp_instances')
              .update(updateData)
              .eq('id', existingInstance.id);

            if (updateError) {
              console.error('[Orphan Sync] ❌ Erro ao atualizar instância:', updateError);
              syncLog.push(`❌ Erro ao atualizar ${vpsInstance.instanceName}: ${updateError.message}`);
              errorCount++;
            } else {
              orphansUpdated++;
              syncLog.push(`🔄 Órfã atualizada: ${vpsInstance.instanceName}`);
              console.log('[Orphan Sync] 🔄 Instância atualizada:', vpsInstance.instanceName);
            }
          } else {
            syncLog.push(`ℹ️ Instância já atualizada: ${vpsInstance.instanceName}`);
          }
        }
      } catch (instanceError) {
        console.error('[Orphan Sync] ❌ Erro ao processar instância:', vpsInstance.instanceName, instanceError);
        syncLog.push(`❌ Erro ao processar ${vpsInstance.instanceName}: ${instanceError.message}`);
        errorCount++;
      }
    }

    // 3. Log da operação
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'sync_orphan_instances',
        status: errorCount === 0 ? 'success' : 'partial_success',
        result: {
          sync_id: syncId,
          orphans_imported: orphansImported,
          orphans_updated: orphansUpdated,
          total_processed: totalProcessed,
          error_count: errorCount,
          sync_log: syncLog
        }
      });

    console.log('[Orphan Sync] ✅ Sincronização concluída:', {
      orphansImported,
      orphansUpdated,
      totalProcessed,
      errorCount
    });

    return {
      success: true,
      data: {
        syncId,
        orphansImported,
        orphansUpdated,
        totalProcessed,
        errorCount,
        syncLog
      }
    };

  } catch (error) {
    console.error('[Orphan Sync] ❌ Erro na sincronização:', error);
    
    // Log do erro
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'sync_orphan_instances',
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
