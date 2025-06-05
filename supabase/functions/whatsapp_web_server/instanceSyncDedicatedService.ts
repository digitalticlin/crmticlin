
import { corsHeaders, VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';

// Serviço dedicado APENAS para sincronização estável VPS <-> Supabase
export async function syncAllInstances(supabase: any) {
  const syncId = `sync_all_${Date.now()}`;
  console.log(`[Dedicated Sync] 🔄 INICIANDO sincronização completa [${syncId}]`);
  
  try {
    // ETAPA 1: Buscar TODAS as instâncias da VPS
    console.log('[Dedicated Sync] 📡 Buscando instâncias da VPS...');
    let vpsInstances = [];
    
    try {
      const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instances`, {
        method: 'GET',
        headers: getVPSHeaders()
      });

      if (vpsResponse.ok) {
        const vpsData = await vpsResponse.json();
        vpsInstances = vpsData.instances || [];
        console.log(`[Dedicated Sync] ✅ VPS retornou ${vpsInstances.length} instâncias`);
      } else {
        throw new Error(`VPS error: ${vpsResponse.status}`);
      }
    } catch (vpsError) {
      console.error('[Dedicated Sync] ❌ Erro ao acessar VPS:', vpsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'VPS inacessível: ' + vpsError.message,
          syncId
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // ETAPA 2: Buscar TODAS as instâncias do Supabase
    console.log('[Dedicated Sync] 📊 Buscando instâncias do Supabase...');
    const { data: supabaseInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('connection_type', 'web');

    if (dbError) {
      throw new Error(`Erro do banco: ${dbError.message}`);
    }

    console.log(`[Dedicated Sync] 📊 Supabase tem ${supabaseInstances?.length || 0} instâncias`);

    // ETAPA 3: Identificar diferenças
    const vpsInstanceIds = vpsInstances.map(v => v.instanceId || v.id).filter(Boolean);
    const supabaseVpsIds = (supabaseInstances || [])
      .map(s => s.vps_instance_id)
      .filter(Boolean);

    // Instâncias que existem na VPS mas não no Supabase (órfãs)
    const orphanVpsIds = vpsInstanceIds.filter(vpsId => !supabaseVpsIds.includes(vpsId));
    
    // Instâncias que existem no Supabase mas não na VPS (mortas)
    const deadSupabaseInstances = (supabaseInstances || [])
      .filter(s => s.vps_instance_id && !vpsInstanceIds.includes(s.vps_instance_id));

    console.log(`[Dedicated Sync] 📋 Análise:`);
    console.log(`[Dedicated Sync] - ${vpsInstances.length} instâncias na VPS`);
    console.log(`[Dedicated Sync] - ${supabaseInstances?.length || 0} instâncias no Supabase`);
    console.log(`[Dedicated Sync] - ${orphanVpsIds.length} órfãs na VPS`);
    console.log(`[Dedicated Sync] - ${deadSupabaseInstances.length} mortas no Supabase`);

    let syncResults = {
      added: 0,
      updated: 0,
      marked_dead: 0,
      errors: []
    };

    // ETAPA 4: Adicionar instâncias órfãs ao Supabase
    console.log('[Dedicated Sync] ➕ Adicionando órfãs...');
    for (const vpsId of orphanVpsIds) {
      try {
        const vpsInstance = vpsInstances.find(v => (v.instanceId || v.id) === vpsId);
        if (!vpsInstance) continue;

        const { error: insertError } = await supabase
          .from('whatsapp_instances')
          .insert({
            instance_name: `sync_${vpsId.slice(-8)}_${Date.now()}`,
            vps_instance_id: vpsId,
            phone: vpsInstance.phone || null,
            profile_name: vpsInstance.profileName || null,
            connection_type: 'web',
            server_url: VPS_CONFIG.baseUrl,
            web_status: vpsInstance.status === 'open' ? 'ready' : 'connecting',
            connection_status: vpsInstance.status === 'open' ? 'ready' : 'connecting',
            company_id: null, // Órfã - será vinculada depois
            date_connected: vpsInstance.status === 'open' ? new Date().toISOString() : null
          });

        if (insertError) {
          console.error(`[Dedicated Sync] ❌ Erro ao inserir ${vpsId}:`, insertError);
          syncResults.errors.push({ vpsId, error: insertError.message });
        } else {
          console.log(`[Dedicated Sync] ✅ Órfã ${vpsId} adicionada`);
          syncResults.added++;
        }
      } catch (err) {
        console.error(`[Dedicated Sync] ❌ Erro inesperado ao adicionar ${vpsId}:`, err);
        syncResults.errors.push({ vpsId, error: err.message });
      }
    }

    // ETAPA 5: Atualizar status das instâncias existentes
    console.log('[Dedicated Sync] 🔄 Atualizando status...');
    for (const vpsInstance of vpsInstances) {
      try {
        const vpsId = vpsInstance.instanceId || vpsInstance.id;
        if (!vpsId) continue;

        const supabaseInstance = supabaseInstances?.find(s => s.vps_instance_id === vpsId);
        if (!supabaseInstance) continue; // Já foi tratada como órfã

        // Verificar se precisa atualizar
        const statusMapping = {
          'open': { connection: 'ready', web: 'ready' },
          'ready': { connection: 'ready', web: 'ready' },
          'connecting': { connection: 'connecting', web: 'connecting' },
          'waiting_scan': { connection: 'connecting', web: 'waiting_scan' },
          'disconnected': { connection: 'disconnected', web: 'disconnected' }
        };

        const mappedStatus = statusMapping[vpsInstance.status] || 
                             { connection: 'disconnected', web: 'disconnected' };

        const needsUpdate = 
          mappedStatus.connection !== supabaseInstance.connection_status ||
          mappedStatus.web !== supabaseInstance.web_status ||
          (vpsInstance.phone && vpsInstance.phone !== supabaseInstance.phone) ||
          (vpsInstance.profileName && vpsInstance.profileName !== supabaseInstance.profile_name);

        if (needsUpdate) {
          const updateData = {
            connection_status: mappedStatus.connection,
            web_status: mappedStatus.web,
            updated_at: new Date().toISOString()
          };

          if (vpsInstance.phone && vpsInstance.phone !== supabaseInstance.phone) {
            updateData.phone = vpsInstance.phone;
          }

          if (vpsInstance.profileName && vpsInstance.profileName !== supabaseInstance.profile_name) {
            updateData.profile_name = vpsInstance.profileName;
          }

          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update(updateData)
            .eq('id', supabaseInstance.id);

          if (updateError) {
            console.error(`[Dedicated Sync] ❌ Erro ao atualizar ${vpsId}:`, updateError);
            syncResults.errors.push({ vpsId, error: updateError.message });
          } else {
            console.log(`[Dedicated Sync] ✅ Status atualizado para ${vpsId}`);
            syncResults.updated++;
          }
        }
      } catch (err) {
        console.error(`[Dedicated Sync] ❌ Erro ao atualizar instância:`, err);
        syncResults.errors.push({ vpsId: 'unknown', error: err.message });
      }
    }

    // ETAPA 6: Marcar instâncias mortas como desconectadas
    console.log('[Dedicated Sync] ⚰️ Marcando instâncias mortas...');
    for (const deadInstance of deadSupabaseInstances) {
      try {
        if (deadInstance.connection_status !== 'disconnected') {
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({
              connection_status: 'disconnected',
              web_status: 'disconnected',
              updated_at: new Date().toISOString()
            })
            .eq('id', deadInstance.id);

          if (updateError) {
            console.error(`[Dedicated Sync] ❌ Erro ao marcar morta ${deadInstance.vps_instance_id}:`, updateError);
            syncResults.errors.push({ 
              vpsId: deadInstance.vps_instance_id, 
              error: updateError.message 
            });
          } else {
            console.log(`[Dedicated Sync] ✅ Marcada como morta: ${deadInstance.vps_instance_id}`);
            syncResults.marked_dead++;
          }
        }
      } catch (err) {
        console.error(`[Dedicated Sync] ❌ Erro ao marcar morta:`, err);
        syncResults.errors.push({ 
          vpsId: deadInstance.vps_instance_id, 
          error: err.message 
        });
      }
    }

    console.log(`[Dedicated Sync] ✅ Sincronização completa [${syncId}]:`);
    console.log(`[Dedicated Sync] - ${syncResults.added} adicionadas`);
    console.log(`[Dedicated Sync] - ${syncResults.updated} atualizadas`);
    console.log(`[Dedicated Sync] - ${syncResults.marked_dead} marcadas como mortas`);
    console.log(`[Dedicated Sync] - ${syncResults.errors.length} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        syncId,
        results: syncResults,
        summary: {
          vps_instances: vpsInstances.length,
          supabase_instances: supabaseInstances?.length || 0,
          orphans_found: orphanVpsIds.length,
          dead_instances: deadSupabaseInstances.length,
          added: syncResults.added,
          updated: syncResults.updated,
          marked_dead: syncResults.marked_dead,
          errors_count: syncResults.errors.length
        },
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Dedicated Sync] ❌ ERRO GERAL [${syncId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        syncId,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
