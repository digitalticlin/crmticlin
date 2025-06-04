
import { corsHeaders, VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';
import { adoptOrphanInstance, isActiveVPSInstance } from './orphanInstanceService.ts';

// FASE 2: Função de sincronização otimizada com logs detalhados
export async function syncInstances(supabase: any, companyId: string) {
  const startTime = Date.now();
  const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[Sync FASE 2] 🚀 INICIANDO sync otimizado ID: ${syncId} para empresa: ${companyId}`);
    
    // ETAPA 1: Buscar instâncias do banco com query otimizada
    console.log('[Sync FASE 2] 📊 Consultando banco (otimizado)...');
    const dbStartTime = Date.now();
    
    const { data: dbInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select(`
        id,
        instance_name,
        vps_instance_id,
        connection_status,
        web_status,
        phone,
        profile_name,
        company_id,
        updated_at
      `)
      .eq('company_id', companyId)
      .eq('connection_type', 'web')
      .order('updated_at', { ascending: false });

    const dbDuration = Date.now() - dbStartTime;

    if (dbError) {
      throw new Error(`Erro no banco de dados: ${dbError.message}`);
    }

    console.log(`[Sync FASE 2] 📊 Banco consultado: ${dbInstances?.length || 0} instâncias (${dbDuration}ms)`);

    // ETAPA 2: Consultar VPS com timeout otimizado
    let vpsInstances = [];
    let vpsError = null;
    let vpsHealthy = false;
    let vpsDuration = 0;
    
    try {
      console.log('[Sync FASE 2] 🖥️ Consultando VPS (otimizado)...');
      const vpsStartTime = Date.now();
      
      const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instances`, {
        method: 'GET',
        headers: getVPSHeaders()
      }, 2); // Apenas 2 tentativas para sync otimizado

      vpsDuration = Date.now() - vpsStartTime;

      if (vpsResponse.ok) {
        const vpsData = await vpsResponse.json();
        vpsInstances = vpsData.instances || [];
        vpsHealthy = true;
        console.log(`[Sync FASE 2] ✅ VPS respondeu: ${vpsInstances.length} instâncias (${vpsDuration}ms)`);
      } else {
        vpsError = `VPS retornou status: ${vpsResponse.status}`;
        console.error(`[Sync FASE 2] ❌ Erro VPS: ${vpsError} (${vpsDuration}ms)`);
      }
    } catch (error) {
      vpsDuration = Date.now() - (Date.now() - vpsDuration);
      vpsError = error.message;
      console.error(`[Sync FASE 2] 💥 Falha VPS: ${vpsError} (${vpsDuration}ms)`);
    }

    const syncResults = [];
    let updatedCount = 0;
    let preservedCount = 0;
    let adoptedCount = 0;
    let errorCount = 0;
    let optimizationSkips = 0;

    // ETAPA 3: Modo de preservação se VPS inacessível
    if (!vpsHealthy) {
      console.log(`[Sync FASE 2] ⚠️ VPS inacessível: ${vpsError}. Preservando estado atual.`);
      
      // Marcar como temporariamente desconectadas apenas as que estavam ativas
      for (const dbInstance of dbInstances || []) {
        if (['ready', 'open'].includes(dbInstance.connection_status)) {
          console.log(`[Sync FASE 2] 🔄 Marcando como temp. desconectada: ${dbInstance.instance_name}`);
          
          await supabase
            .from('whatsapp_instances')
            .update({
              connection_status: 'disconnected',
              web_status: 'disconnected',
              updated_at: new Date().toISOString()
            })
            .eq('id', dbInstance.id);
            
          updatedCount++;
        } else {
          preservedCount++;
        }
      }

      const totalDuration = Date.now() - startTime;
      return new Response(
        JSON.stringify({ 
          success: true, 
          syncId,
          results: syncResults,
          summary: {
            updated: updatedCount,
            preserved: preservedCount,
            adopted: 0,
            errors: 1,
            optimizationSkips: 0,
            vps_healthy: false,
            vps_error: vpsError,
            performance: {
              totalDuration: `${totalDuration}ms`,
              dbDuration: `${dbDuration}ms`,
              vpsDuration: `${vpsDuration}ms`
            }
          },
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ETAPA 4: Sync otimizado com verificação de mudanças - FASE 2
    console.log('[Sync FASE 2] ✅ VPS saudável - sync otimizado...');
    
    const batchUpdates = []; // Para batch updates mais eficientes
    
    for (const dbInstance of dbInstances || []) {
      try {
        const vpsInstance = vpsInstances.find(v => v.instanceId === dbInstance.vps_instance_id);
        
        if (vpsInstance) {
          // FASE 2: Verificação otimizada de mudanças
          const currentTimestamp = new Date(dbInstance.updated_at).getTime();
          const timeSinceUpdate = Date.now() - currentTimestamp;
          
          // Mapeamento otimizado de status
          const statusMapping = {
            'ready': { connection: 'ready', web: 'ready' },
            'open': { connection: 'ready', web: 'ready' },  
            'connecting': { connection: 'connecting', web: 'connecting' },
            'waiting_scan': { connection: 'connecting', web: 'waiting_scan' },
            'disconnected': { connection: 'disconnected', web: 'disconnected' },
            'error': { connection: 'error', web: 'error' }
          };
          
          const mappedStatus = statusMapping[vpsInstance.status] || 
                              { connection: 'disconnected', web: 'disconnected' };
          
          // Verificar se realmente houve mudanças significativas
          const hasStatusChange = mappedStatus.connection !== dbInstance.connection_status ||
                                 mappedStatus.web !== dbInstance.web_status;
          const hasDataChange = (vpsInstance.phone && vpsInstance.phone !== dbInstance.phone) ||
                               (vpsInstance.profileName && vpsInstance.profileName !== dbInstance.profile_name);
          
          if (!hasStatusChange && !hasDataChange && timeSinceUpdate < 300000) { // 5 minutos
            // OTIMIZAÇÃO: Skip se não houve mudanças significativas
            optimizationSkips++;
            preservedCount++;
            continue;
          }
          
          // Preparar updates apenas para campos que mudaram
          const updates: any = { updated_at: new Date().toISOString() };
          let changesList = [];
          
          if (hasStatusChange) {
            updates.connection_status = mappedStatus.connection;
            updates.web_status = mappedStatus.web;
            changesList.push(`status: ${dbInstance.connection_status} -> ${mappedStatus.connection}`);
          }
          
          if (vpsInstance.phone && vpsInstance.phone !== dbInstance.phone) {
            updates.phone = vpsInstance.phone;
            changesList.push(`phone: ${dbInstance.phone} -> ${vpsInstance.phone}`);
          }
          
          if (vpsInstance.profileName && vpsInstance.profileName !== dbInstance.profile_name) {
            updates.profile_name = vpsInstance.profileName;
            changesList.push(`profile: ${dbInstance.profile_name} -> ${vpsInstance.profileName}`);
          }
          
          if (Object.keys(updates).length > 1) { // Mais que apenas updated_at
            batchUpdates.push({
              id: dbInstance.id,
              updates,
              changes: changesList
            });
            
            console.log(`[Sync FASE 2] 📝 Mudanças detectadas em ${dbInstance.instance_name}: ${changesList.join(', ')}`);
            updatedCount++;
          } else {
            preservedCount++;
          }
          
        } else {
          // Instância órfã - marcar como desconectada se não estava
          if (dbInstance.connection_status !== 'disconnected') {
            batchUpdates.push({
              id: dbInstance.id,
              updates: {
                connection_status: 'disconnected',
                web_status: 'disconnected',
                updated_at: new Date().toISOString()
              },
              changes: ['marked as disconnected - not found in VPS']
            });
            updatedCount++;
          } else {
            preservedCount++;
          }
        }
      } catch (instanceError) {
        console.error(`[Sync FASE 2] ❌ Erro processando ${dbInstance.instance_name}:`, instanceError);
        errorCount++;
      }
    }

    // ETAPA 5: Executar batch updates de forma otimizada
    if (batchUpdates.length > 0) {
      console.log(`[Sync FASE 2] 💾 Executando ${batchUpdates.length} updates em batch...`);
      
      for (const update of batchUpdates) {
        try {
          await supabase
            .from('whatsapp_instances')
            .update(update.updates)
            .eq('id', update.id);
        } catch (updateError) {
          console.error(`[Sync FASE 2] ❌ Erro no batch update:`, updateError);
          errorCount++;
        }
      }
    }

    // ETAPA 6: Adoção conservadora de órfãs - FASE 2
    console.log(`[Sync FASE 2] 🔍 Verificando órfãs (modo conservador)...`);
    
    for (const vpsInstance of vpsInstances) {
      try {
        const existsInDB = dbInstances?.some(db => db.vps_instance_id === vpsInstance.instanceId);
        
        if (!existsInDB && isActiveVPSInstance(vpsInstance) && 
            vpsInstance.status === 'ready') { // Apenas ready para FASE 2
          
          console.log(`[Sync FASE 2] 🆕 Adotando órfã READY: ${vpsInstance.instanceId}`);
          
          const adoptResult = await adoptOrphanInstance(supabase, vpsInstance, companyId);
          
          if (adoptResult.action === 'adopted') {
            adoptedCount++;
          } else {
            errorCount++;
          }
        }
      } catch (orphanError) {
        console.error(`[Sync FASE 2] ❌ Erro processando órfã:`, orphanError);
        errorCount++;
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[Sync FASE 2] 🏁 Finalizado [${syncId}]: ${updatedCount} updates, ${preservedCount} preserved, ${adoptedCount} adopted, ${optimizationSkips} skipped (${totalDuration}ms)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        syncId,
        summary: {
          updated: updatedCount,
          preserved: preservedCount,
          adopted: adoptedCount,
          errors: errorCount,
          optimizationSkips,
          total_vps_instances: vpsInstances.length,
          total_db_instances: (dbInstances?.length || 0),
          vps_healthy: vpsHealthy,
          performance: {
            totalDuration: `${totalDuration}ms`,
            dbDuration: `${dbDuration}ms`,
            vpsDuration: `${vpsDuration}ms`,
            avgInstanceProcessing: dbInstances?.length ? `${Math.round(totalDuration / dbInstances.length)}ms` : '0ms'
          }
        },
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[Sync FASE 2] ❌ ERRO GERAL [${syncId}]:`, error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        syncId,
        error: error.message,
        phase: 'FASE_2_OTIMIZACAO',
        performance: {
          totalDuration: `${totalDuration}ms`
        },
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
