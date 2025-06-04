
import { corsHeaders, VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';
import { adoptOrphanInstance, isActiveVPSInstance } from './orphanInstanceService.ts';

// FASE 1: Função de sincronização estabilizada e otimizada
export async function syncInstances(supabase: any, companyId: string) {
  try {
    console.log(`[Sync] 🔄 INICIANDO sync estabilizado FASE 1 para empresa: ${companyId}`);
    
    // ETAPA 1: Buscar instâncias do banco com validação
    console.log('[Sync] 📊 Buscando instâncias do banco...');
    const { data: dbInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('company_id', companyId)
      .eq('connection_type', 'web');

    if (dbError) {
      throw new Error(`Erro no banco de dados: ${dbError.message}`);
    }

    console.log(`[Sync] 📊 Instâncias no banco: ${dbInstances?.length || 0}`);

    // ETAPA 2: Buscar instâncias do VPS com retry melhorado
    let vpsInstances = [];
    let vpsError = null;
    let vpsHealthy = false;
    
    try {
      console.log('[Sync] 🖥️ Consultando VPS...');
      const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instances`, {
        method: 'GET',
        headers: getVPSHeaders()
      });

      if (vpsResponse.ok) {
        const vpsData = await vpsResponse.json();
        vpsInstances = vpsData.instances || [];
        vpsHealthy = true;
        console.log(`[Sync] ✅ VPS respondeu - instâncias encontradas: ${vpsInstances.length}`);
      } else {
        vpsError = `VPS retornou status: ${vpsResponse.status}`;
        console.error(`[Sync] ❌ Erro VPS: ${vpsError}`);
      }
    } catch (error) {
      vpsError = error.message;
      console.error(`[Sync] 💥 Falha ao acessar VPS: ${vpsError}`);
    }

    const syncResults = [];
    let updatedCount = 0;
    let preservedCount = 0;
    let adoptedCount = 0;
    let errorCount = 0;

    // ETAPA 3: Se VPS inacessível, preservar instâncias existentes (FASE 1)
    if (!vpsHealthy) {
      console.log(`[Sync] ⚠️ VPS inacessível: ${vpsError}. Modo de preservação ativado.`);
      
      for (const dbInstance of dbInstances || []) {
        // Marcar como desconectada se estava conectada
        if (dbInstance.connection_status === 'ready' || dbInstance.connection_status === 'open') {
          console.log(`[Sync] 🔄 Marcando instância como temporariamente desconectada: ${dbInstance.instance_name}`);
          
          await supabase
            .from('whatsapp_instances')
            .update({
              connection_status: 'disconnected',
              web_status: 'disconnected',
              updated_at: new Date().toISOString()
            })
            .eq('id', dbInstance.id);
            
          syncResults.push({
            instanceId: dbInstance.id,
            action: 'temp_disconnected',
            reason: 'vps_unreachable',
            previous_status: dbInstance.connection_status
          });
          updatedCount++;
        } else {
          syncResults.push({
            instanceId: dbInstance.id,
            action: 'preserved',
            reason: 'vps_unreachable',
            current_status: dbInstance.connection_status
          });
          preservedCount++;
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          results: syncResults,
          summary: {
            updated: updatedCount,
            preserved: preservedCount,
            adopted: 0,
            errors: 1,
            vps_healthy: false,
            vps_error: vpsError
          },
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ETAPA 4: VPS saudável - sincronizar instâncias existentes (FASE 1)
    console.log('[Sync] ✅ VPS saudável - sincronizando instâncias...');
    
    for (const dbInstance of dbInstances || []) {
      try {
        console.log(`[Sync] 🔍 Processando: ${dbInstance.instance_name} (VPS: ${dbInstance.vps_instance_id})`);
        
        const vpsInstance = vpsInstances.find(v => v.instanceId === dbInstance.vps_instance_id);
        
        if (vpsInstance) {
          console.log(`[Sync] ✅ Instância encontrada no VPS: ${vpsInstance.status}`);
          
          // FASE 1: Mapeamento de status mais robusto
          const updates: any = {};
          let hasChanges = false;
          
          // Mapear status da VPS para status do banco
          const statusMapping = {
            'ready': { connection: 'ready', web: 'ready' },
            'open': { connection: 'open', web: 'ready' },  
            'connecting': { connection: 'connecting', web: 'connecting' },
            'waiting_scan': { connection: 'connecting', web: 'waiting_scan' },
            'disconnected': { connection: 'disconnected', web: 'disconnected' },
            'error': { connection: 'error', web: 'error' }
          };
          
          const mappedStatus = statusMapping[vpsInstance.status] || 
                              { connection: 'disconnected', web: 'disconnected' };
          
          // Verificar mudanças de status de conexão
          if (mappedStatus.connection !== dbInstance.connection_status) {
            updates.connection_status = mappedStatus.connection;
            hasChanges = true;
            console.log(`[Sync] 📝 Status conexão: ${dbInstance.connection_status} -> ${mappedStatus.connection}`);
          }
          
          // Verificar mudanças de status web
          if (mappedStatus.web !== dbInstance.web_status) {
            updates.web_status = mappedStatus.web;
            hasChanges = true;
            console.log(`[Sync] 📝 Status web: ${dbInstance.web_status} -> ${mappedStatus.web}`);
          }
          
          // Verificar mudanças de telefone
          if (vpsInstance.phone && vpsInstance.phone !== dbInstance.phone) {
            updates.phone = vpsInstance.phone;
            hasChanges = true;
            console.log(`[Sync] 📱 Telefone: ${dbInstance.phone} -> ${vpsInstance.phone}`);
          }
          
          // Verificar mudanças de profile
          if (vpsInstance.profileName && vpsInstance.profileName !== dbInstance.profile_name) {
            updates.profile_name = vpsInstance.profileName;
            hasChanges = true;
            console.log(`[Sync] 👤 Profile: ${dbInstance.profile_name} -> ${vpsInstance.profileName}`);
          }
          
          if (hasChanges) {
            updates.updated_at = new Date().toISOString();
            
            await supabase
              .from('whatsapp_instances')
              .update(updates)
              .eq('id', dbInstance.id);
              
            syncResults.push({
              instanceId: dbInstance.id,
              action: 'updated',
              changes: updates,
              vps_status: vpsInstance.status
            });
            
            updatedCount++;
            console.log(`[Sync] ✅ Instância atualizada: ${dbInstance.instance_name}`);
          } else {
            syncResults.push({
              instanceId: dbInstance.id,
              action: 'unchanged',
              current_status: dbInstance.connection_status
            });
            preservedCount++;
            console.log(`[Sync] ➡️ Instância inalterada: ${dbInstance.instance_name}`);
          }
        } else {
          // Instância no banco mas não no VPS
          console.log(`[Sync] ⚠️ Instância órfã detectada: ${dbInstance.instance_name}`);
          
          if (dbInstance.connection_status !== 'disconnected') {
            await supabase
              .from('whatsapp_instances')
              .update({
                connection_status: 'disconnected',
                web_status: 'disconnected',
                updated_at: new Date().toISOString()
              })
              .eq('id', dbInstance.id);
              
            syncResults.push({
              instanceId: dbInstance.id,
              action: 'marked_disconnected',
              reason: 'not_found_in_vps',
              previous_status: dbInstance.connection_status
            });
            updatedCount++;
          } else {
            syncResults.push({
              instanceId: dbInstance.id,
              action: 'already_disconnected',
              reason: 'not_found_in_vps'
            });
            preservedCount++;
          }
        }
      } catch (instanceError) {
        console.error(`[Sync] ❌ Erro processando ${dbInstance.instance_name}:`, instanceError);
        syncResults.push({
          instanceId: dbInstance.id,
          action: 'error',
          error: instanceError.message
        });
        errorCount++;
      }
    }

    // ETAPA 5: Detectar e adotar instâncias órfãs ATIVAS (FASE 1 - Mais conservador)
    console.log(`[Sync] 🔍 Verificando instâncias órfãs no VPS...`);
    
    for (const vpsInstance of vpsInstances) {
      try {
        const existsInDB = dbInstances?.some(db => db.vps_instance_id === vpsInstance.instanceId);
        
        if (!existsInDB) {
          console.log(`[Sync] 🕵️ Instância órfã: ${vpsInstance.instanceId} (status: ${vpsInstance.status})`);
          
          // FASE 1: Só adotar se realmente ativa e estável
          if (isActiveVPSInstance(vpsInstance) && 
              (vpsInstance.status === 'ready' || vpsInstance.status === 'open')) {
            
            console.log(`[Sync] 🆕 Adotando instância órfã ATIVA: ${vpsInstance.instanceId}`);
            
            const adoptResult = await adoptOrphanInstance(supabase, vpsInstance, companyId);
            syncResults.push(adoptResult);
            
            if (adoptResult.action === 'adopted') {
              adoptedCount++;
              console.log(`[Sync] ✅ Instância órfã adotada: ${vpsInstance.instanceId}`);
            } else {
              errorCount++;
              console.log(`[Sync] ❌ Falha na adoção: ${vpsInstance.instanceId}`);
            }
          } else {
            console.log(`[Sync] 🚫 Instância órfã ignorada (não ativa): ${vpsInstance.instanceId}`);
            syncResults.push({
              instanceId: vpsInstance.instanceId,
              action: 'orphan_inactive',
              status: vpsInstance.status,
              reason: 'not_ready_for_adoption'
            });
          }
        }
      } catch (orphanError) {
        console.error(`[Sync] ❌ Erro processando órfã ${vpsInstance.instanceId}:`, orphanError);
        syncResults.push({
          instanceId: vpsInstance.instanceId,
          action: 'orphan_error',
          error: orphanError.message
        });
        errorCount++;
      }
    }

    console.log(`[Sync] 🏁 FASE 1 finalizada: ${updatedCount} atualizadas, ${preservedCount} preservadas, ${adoptedCount} adotadas, ${errorCount} erros`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: syncResults,
        summary: {
          updated: updatedCount,
          preserved: preservedCount,
          adopted: adoptedCount,
          errors: errorCount,
          total_vps_instances: vpsInstances.length,
          total_db_instances: (dbInstances?.length || 0),
          vps_healthy: vpsHealthy
        },
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Sync] ❌ ERRO GERAL FASE 1:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        phase: 'FASE_1_ESTABILIZACAO',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
