
import { corsHeaders, VPS_CONFIG, getVPSHeaders } from './config.ts';
import { getVPSInstances } from './vpsRequestService.ts';

// Serviço dedicado APENAS para sincronização estável VPS <-> Supabase
export async function syncAllInstances(supabase: any) {
  const syncId = `sync_all_${Date.now()}`;
  const startTime = Date.now();
  console.log(`[Dedicated Sync] 🔄 INICIANDO sincronização completa [${syncId}]`);
  
  try {
    // ETAPA 1: Buscar TODAS as instâncias da VPS
    console.log('[Dedicated Sync] 📡 Buscando instâncias da VPS...');
    const vpsResult = await getVPSInstances();
    
    if (!vpsResult.success) {
      console.error('[Dedicated Sync] ❌ Erro ao acessar VPS:', vpsResult.error);
      await logSyncExecution(supabase, 'error', 0, 0, 0, 1, Date.now() - startTime, vpsResult.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'VPS inacessível: ' + vpsResult.error,
          syncId
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const vpsInstances = vpsResult.instances;
    console.log(`[Dedicated Sync] ✅ VPS retornou ${vpsInstances.length} instâncias`);

    // ETAPA 2: Buscar TODAS as instâncias do Supabase
    console.log('[Dedicated Sync] 📊 Buscando instâncias do Supabase...');
    const { data: supabaseInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('connection_type', 'web');

    if (dbError) {
      console.error('[Dedicated Sync] ❌ Erro do banco:', dbError);
      await logSyncExecution(supabase, 'error', 0, 0, 0, 1, Date.now() - startTime, dbError.message);
      throw new Error(`Erro do banco: ${dbError.message}`);
    }

    console.log(`[Dedicated Sync] 📊 Supabase tem ${supabaseInstances?.length || 0} instâncias`);

    // **NOVA FUNÇÃO**: Limpeza e validação de telefone CORRIGIDA
    const cleanAndValidatePhone = (phone: string): string | null => {
      if (!phone) return null;
      
      // **BLOQUEIO DE GRUPOS**: Se contém @g.us, retornar null (não salvar)
      if (phone.includes('@g.us')) {
        console.log(`[Dedicated Sync] 🚫 Grupo bloqueado: ${phone}`);
        return null;
      }
      
      // Remover @c.us, @s.whatsapp.net e outros sufixos
      let cleanPhone = phone.replace(/@c\.us$/, '').replace(/@s\.whatsapp\.net$/, '').replace(/\D/g, '');
      
      // Validar se é um telefone válido (mínimo 10 dígitos)
      if (cleanPhone.length < 10) return null;
      
      return cleanPhone;
    };

    // **MAPEAMENTO DE STATUS COMPLETO E CORRIGIDO**
    const mapVPSStatusToSupabase = (vpsStatus: string) => {
      const statusMapping = {
        'open': { connection: 'ready', web: 'ready' },
        'ready': { connection: 'ready', web: 'ready' },
        'connecting': { connection: 'connecting', web: 'connecting' },
        'waiting_scan': { connection: 'connecting', web: 'waiting_scan' },
        'qr_ready': { connection: 'connecting', web: 'waiting_scan' },
        'disconnected': { connection: 'disconnected', web: 'disconnected' },
        'close': { connection: 'disconnected', web: 'disconnected' },
        'closed': { connection: 'disconnected', web: 'disconnected' }
      };

      return statusMapping[vpsStatus] || { connection: 'disconnected', web: 'disconnected' };
    };

    let syncResults = {
      added: 0,
      updated: 0,
      preserved_links: 0,
      errors: []
    };

    // ETAPA 3: Processar TODAS as instâncias da VPS (APENAS ADICIONAR E ATUALIZAR)
    console.log('[Dedicated Sync] 🔄 Processando instâncias da VPS...');
    
    for (const vpsInstance of vpsInstances) {
      try {
        const vpsId = vpsInstance.instanceId || vpsInstance.id;
        if (!vpsId) continue;

        // **APLICAR LIMPEZA DE TELEFONE**
        const cleanPhone = cleanAndValidatePhone(vpsInstance.phone);
        
        // Se é um grupo, pular completamente
        if (vpsInstance.phone && vpsInstance.phone.includes('@g.us')) {
          console.log(`[Dedicated Sync] 🚫 Pulando grupo: ${vpsId} (${vpsInstance.phone})`);
          continue;
        }

        // Verificar se já existe no Supabase
        const existingInstance = supabaseInstances?.find(s => s.vps_instance_id === vpsId);

        if (!existingInstance) {
          // ADICIONAR: Instância não existe no Supabase
          console.log(`[Dedicated Sync] 🆕 Adicionando nova instância: ${vpsId}`);

          const mappedStatus = mapVPSStatusToSupabase(vpsInstance.status);

          const { error: insertError } = await supabase
            .from('whatsapp_instances')
            .insert({
              instance_name: `sync_${vpsId.slice(-8)}_${Date.now()}`,
              vps_instance_id: vpsId,
              phone: cleanPhone,
              profile_name: vpsInstance.profileName || null,
              connection_type: 'web',
              server_url: VPS_CONFIG.baseUrl,
              web_status: mappedStatus.web,
              connection_status: mappedStatus.connection,
              company_id: null,
              created_by_user_id: null,
              date_connected: ['ready', 'open'].includes(vpsInstance.status) ? new Date().toISOString() : null,
              qr_code: vpsInstance.hasQR ? 'pending' : null
            });

          if (insertError) {
            console.error(`[Dedicated Sync] ❌ Erro ao inserir ${vpsId}:`, insertError);
            syncResults.errors.push({ vpsId, error: insertError.message });
          } else {
            console.log(`[Dedicated Sync] ✅ Nova instância ${vpsId} adicionada`);
            console.log(`[Dedicated Sync] - Status: ${vpsInstance.status} -> ${mappedStatus.connection}/${mappedStatus.web}`);
            console.log(`[Dedicated Sync] - Telefone: ${vpsInstance.phone} -> ${cleanPhone}`);
            syncResults.added++;
          }
        } else {
          // ATUALIZAR: Instância já existe, atualizar dados
          console.log(`[Dedicated Sync] 🔄 Atualizando instância existente: ${vpsId}`);

          // PRESERVAR vínculos existentes
          if (existingInstance.company_id || existingInstance.created_by_user_id) {
            console.log(`[Dedicated Sync] 🔗 Preservando vínculo: empresa ${existingInstance.company_id} | criador ${existingInstance.created_by_user_id}`);
            syncResults.preserved_links++;
          }

          const mappedStatus = mapVPSStatusToSupabase(vpsInstance.status);

          // Preparar dados para atualização
          const updateData: any = {
            connection_status: mappedStatus.connection,
            web_status: mappedStatus.web,
            updated_at: new Date().toISOString()
          };

          // Atualizar telefone limpo se disponível e diferente
          if (cleanPhone && cleanPhone !== existingInstance.phone) {
            updateData.phone = cleanPhone;
            console.log(`[Dedicated Sync] 📞 Atualizando telefone: ${existingInstance.phone} -> ${cleanPhone}`);
          }

          // Atualizar nome do perfil se disponível e diferente
          if (vpsInstance.profileName && vpsInstance.profileName !== existingInstance.profile_name) {
            updateData.profile_name = vpsInstance.profileName;
            console.log(`[Dedicated Sync] 👤 Atualizando perfil: ${existingInstance.profile_name} -> ${vpsInstance.profileName}`);
          }

          // Atualizar data de conexão baseada no status
          if (['ready', 'open'].includes(vpsInstance.status) && !existingInstance.date_connected) {
            updateData.date_connected = new Date().toISOString();
          } else if (!['ready', 'open'].includes(vpsInstance.status) && existingInstance.date_connected) {
            updateData.date_disconnected = new Date().toISOString();
          }

          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update(updateData)
            .eq('id', existingInstance.id);

          if (updateError) {
            console.error(`[Dedicated Sync] ❌ Erro ao atualizar ${vpsId}:`, updateError);
            syncResults.errors.push({ vpsId, error: updateError.message });
          } else {
            console.log(`[Dedicated Sync] ✅ Instância ${vpsId} atualizada (vínculos preservados)`);
            console.log(`[Dedicated Sync] - Status: ${vpsInstance.status} -> ${mappedStatus.connection}/${mappedStatus.web}`);
            syncResults.updated++;
          }
        }
      } catch (err) {
        console.error(`[Dedicated Sync] ❌ Erro ao processar instância:`, err);
        syncResults.errors.push({ vpsId: 'unknown', error: err.message });
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`[Dedicated Sync] ✅ Sincronização completa [${syncId}] em ${executionTime}ms:`);
    console.log(`[Dedicated Sync] - ${syncResults.added} adicionadas`);
    console.log(`[Dedicated Sync] - ${syncResults.updated} atualizadas`);
    console.log(`[Dedicated Sync] - ${syncResults.preserved_links} vínculos preservados`);
    console.log(`[Dedicated Sync] - ${syncResults.errors.length} erros`);

    // Log da execução
    await logSyncExecution(
      supabase, 
      syncResults.errors.length > 0 ? 'partial' : 'success',
      vpsInstances.length,
      syncResults.added,
      syncResults.updated,
      syncResults.errors.length,
      executionTime,
      syncResults.errors.length > 0 ? JSON.stringify(syncResults.errors) : null
    );

    return new Response(
      JSON.stringify({
        success: true,
        syncId,
        results: syncResults,
        summary: {
          vps_instances: vpsInstances.length,
          supabase_instances: supabaseInstances?.length || 0,
          added: syncResults.added,
          updated: syncResults.updated,
          preserved_links: syncResults.preserved_links,
          errors_count: syncResults.errors.length
        },
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[Dedicated Sync] ❌ ERRO GERAL [${syncId}]:`, error);
    
    await logSyncExecution(supabase, 'error', 0, 0, 0, 1, executionTime, error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        syncId,
        error: error.message,
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Função helper para log de execução
async function logSyncExecution(
  supabase: any, 
  status: string, 
  instancesFound: number, 
  instancesAdded: number, 
  instancesUpdated: number, 
  errorsCount: number, 
  executionDuration: number, 
  errorDetails: string | null
) {
  try {
    await supabase
      .from('auto_sync_logs')
      .insert({
        status,
        instances_found: instancesFound,
        instances_added: instancesAdded,
        instances_updated: instancesUpdated,
        errors_count: errorsCount,
        execution_duration_ms: executionDuration,
        error_details: errorDetails ? JSON.parse(errorDetails) : null
      });
  } catch (err) {
    console.error('[Dedicated Sync] ❌ Erro ao salvar log:', err);
  }
}
