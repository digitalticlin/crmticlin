
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

    // ETAPA 3: Identificar diferenças (CORRIGIDO - PRESERVAR VÍNCULOS)
    const vpsInstanceIds = vpsInstances.map(v => v.instanceId || v.id).filter(Boolean);
    const supabaseVpsIds = (supabaseInstances || [])
      .map(s => s.vps_instance_id)
      .filter(Boolean);

    // CORREÇÃO CRÍTICA: Instâncias que existem na VPS mas não no Supabase (órfãs REAIS)
    const orphanVpsIds = vpsInstanceIds.filter(vpsId => !supabaseVpsIds.includes(vpsId));
    
    // Instâncias que existem no Supabase mas não na VPS (mortas)
    const deadSupabaseInstances = (supabaseInstances || [])
      .filter(s => s.vps_instance_id && !vpsInstanceIds.includes(s.vps_instance_id));

    console.log(`[Dedicated Sync] 📋 Análise:`);
    console.log(`[Dedicated Sync] - ${vpsInstances.length} instâncias na VPS`);
    console.log(`[Dedicated Sync] - ${supabaseInstances?.length || 0} instâncias no Supabase`);
    console.log(`[Dedicated Sync] - ${orphanVpsIds.length} órfãs REAIS na VPS`);
    console.log(`[Dedicated Sync] - ${deadSupabaseInstances.length} mortas no Supabase`);

    let syncResults = {
      added: 0,
      updated: 0,
      marked_dead: 0,
      preserved_links: 0,
      errors: []
    };

    // **NOVA FUNÇÃO**: Limpeza e validação de telefone
    const cleanAndValidatePhone = (phone: string): string | null => {
      if (!phone) return null;
      
      // Remover @c.us e outros sufixos
      let cleanPhone = phone.replace(/@c\.us$/, '').replace(/@s\.whatsapp\.net$/, '').replace(/\D/g, '');
      
      // **BLOQUEIO DE GRUPOS**: Se terminar com @g.us, ignorar (não salvar)
      if (phone.includes('@g.us')) {
        console.log(`[Dedicated Sync] 🚫 Grupo bloqueado: ${phone}`);
        return null;
      }
      
      // Validar se é um telefone válido (mínimo 10 dígitos)
      if (cleanPhone.length < 10) return null;
      
      return cleanPhone;
    };

    // **MAPEAMENTO DE STATUS CORRIGIDO**
    const mapVPSStatusToSupabase = (vpsStatus: string) => {
      const statusMapping = {
        'open': { connection: 'ready', web: 'ready' },
        'ready': { connection: 'ready', web: 'ready' }, // **CORREÇÃO**: ready deve mapear para ready
        'connecting': { connection: 'connecting', web: 'connecting' },
        'waiting_scan': { connection: 'connecting', web: 'waiting_scan' },
        'qr_ready': { connection: 'connecting', web: 'waiting_scan' }, // **CORREÇÃO**: qr_ready = aguardando scan
        'disconnected': { connection: 'disconnected', web: 'disconnected' },
        'close': { connection: 'disconnected', web: 'disconnected' }
      };

      return statusMapping[vpsStatus] || { connection: 'disconnected', web: 'disconnected' };
    };

    // ETAPA 4: Adicionar APENAS instâncias órfãs REAIS ao Supabase
    console.log('[Dedicated Sync] ➕ Adicionando órfãs REAIS...');
    for (const vpsId of orphanVpsIds) {
      try {
        const vpsInstance = vpsInstances.find(v => (v.instanceId || v.id) === vpsId);
        if (!vpsInstance) continue;

        // **APLICAR LIMPEZA DE TELEFONE**
        const cleanPhone = cleanAndValidatePhone(vpsInstance.phone);
        
        // Se é um grupo, pular
        if (vpsInstance.phone && vpsInstance.phone.includes('@g.us')) {
          console.log(`[Dedicated Sync] 🚫 Pulando grupo: ${vpsId} (${vpsInstance.phone})`);
          continue;
        }

        console.log(`[Dedicated Sync] 🆕 Criando órfã real: ${vpsId}`);

        // **MAPEAMENTO CORRETO DE STATUS**
        const mappedStatus = mapVPSStatusToSupabase(vpsInstance.status);

        // **CORREÇÃO CRÍTICA**: Usar created_by_user_id: NULL para órfãs
        const { error: insertError } = await supabase
          .from('whatsapp_instances')
          .insert({
            instance_name: `sync_${vpsId.slice(-8)}_${Date.now()}`,
            vps_instance_id: vpsId,
            phone: cleanPhone, // **TELEFONE LIMPO**
            profile_name: vpsInstance.profileName || null,
            connection_type: 'web',
            server_url: VPS_CONFIG.baseUrl,
            web_status: mappedStatus.web, // **STATUS CORRIGIDO**
            connection_status: mappedStatus.connection, // **STATUS CORRIGIDO**
            company_id: null, // Órfã sem empresa
            created_by_user_id: null, // **CORREÇÃO**: NULL para órfãs não vinculadas
            date_connected: ['ready', 'open'].includes(vpsInstance.status) ? new Date().toISOString() : null,
            qr_code: vpsInstance.hasQR ? 'pending' : null
          });

        if (insertError) {
          console.error(`[Dedicated Sync] ❌ Erro ao inserir ${vpsId}:`, insertError);
          syncResults.errors.push({ vpsId, error: insertError.message });
        } else {
          console.log(`[Dedicated Sync] ✅ Órfã real ${vpsId} adicionada (created_by_user_id: NULL)`);
          console.log(`[Dedicated Sync] - Status: ${vpsInstance.status} -> ${mappedStatus.connection}/${mappedStatus.web}`);
          console.log(`[Dedicated Sync] - Telefone: ${vpsInstance.phone} -> ${cleanPhone}`);
          syncResults.added++;
        }
      } catch (err) {
        console.error(`[Dedicated Sync] ❌ Erro inesperado ao adicionar ${vpsId}:`, err);
        syncResults.errors.push({ vpsId, error: err.message });
      }
    }

    // ETAPA 5: Atualizar status das instâncias existentes (PRESERVANDO VÍNCULOS + DADOS COMPLETOS)
    console.log('[Dedicated Sync] 🔄 Atualizando status e dados (preservando vínculos)...');
    for (const vpsInstance of vpsInstances) {
      try {
        const vpsId = vpsInstance.instanceId || vpsInstance.id;
        if (!vpsId) continue;

        const supabaseInstance = supabaseInstances?.find(s => s.vps_instance_id === vpsId);
        if (!supabaseInstance) continue; // Já foi tratada como órfã

        // CORREÇÃO: Verificar se já tem vínculo manual (company_id OU created_by_user_id)
        if (supabaseInstance.company_id || supabaseInstance.created_by_user_id) {
          console.log(`[Dedicated Sync] 🔗 Preservando vínculo existente: ${vpsId} -> empresa ${supabaseInstance.company_id} | criador ${supabaseInstance.created_by_user_id}`);
          syncResults.preserved_links++;
        }

        // **APLICAR LIMPEZA DE TELEFONE**
        const cleanPhone = cleanAndValidatePhone(vpsInstance.phone);
        
        // **MAPEAMENTO CORRETO DE STATUS**
        const mappedStatus = mapVPSStatusToSupabase(vpsInstance.status);

        // Verificar se precisa atualizar STATUS e DADOS (não os vínculos)
        const needsUpdate = 
          mappedStatus.connection !== supabaseInstance.connection_status ||
          mappedStatus.web !== supabaseInstance.web_status ||
          (cleanPhone && cleanPhone !== supabaseInstance.phone) ||
          (vpsInstance.profileName && vpsInstance.profileName !== supabaseInstance.profile_name);

        if (needsUpdate) {
          const updateData: any = {
            connection_status: mappedStatus.connection,
            web_status: mappedStatus.web,
            updated_at: new Date().toISOString()
            // IMPORTANTE: NÃO atualizar company_id nem created_by_user_id - preservar vínculos
          };

          // **ATUALIZAR TELEFONE LIMPO SE DISPONÍVEL**
          if (cleanPhone && cleanPhone !== supabaseInstance.phone) {
            updateData.phone = cleanPhone;
            console.log(`[Dedicated Sync] 📞 Atualizando telefone: ${supabaseInstance.phone} -> ${cleanPhone}`);
          }

          // **ATUALIZAR NOME DO PERFIL SE DISPONÍVEL**
          if (vpsInstance.profileName && vpsInstance.profileName !== supabaseInstance.profile_name) {
            updateData.profile_name = vpsInstance.profileName;
            console.log(`[Dedicated Sync] 👤 Atualizando perfil: ${supabaseInstance.profile_name} -> ${vpsInstance.profileName}`);
          }

          // **ATUALIZAR DATA DE CONEXÃO**
          if (['ready', 'open'].includes(vpsInstance.status) && !supabaseInstance.date_connected) {
            updateData.date_connected = new Date().toISOString();
          } else if (!['ready', 'open'].includes(vpsInstance.status) && supabaseInstance.date_connected) {
            updateData.date_disconnected = new Date().toISOString();
          }

          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update(updateData)
            .eq('id', supabaseInstance.id);

          if (updateError) {
            console.error(`[Dedicated Sync] ❌ Erro ao atualizar ${vpsId}:`, updateError);
            syncResults.errors.push({ vpsId, error: updateError.message });
          } else {
            console.log(`[Dedicated Sync] ✅ Dados atualizados para ${vpsId} (vínculos preservados)`);
            console.log(`[Dedicated Sync] - Status: ${vpsInstance.status} -> ${mappedStatus.connection}/${mappedStatus.web}`);
            syncResults.updated++;
          }
        } else {
          console.log(`[Dedicated Sync] ✅ ${vpsId} já está sincronizado`);
        }
      } catch (err) {
        console.error(`[Dedicated Sync] ❌ Erro ao atualizar instância:`, err);
        syncResults.errors.push({ vpsId: 'unknown', error: err.message });
      }
    }

    // ETAPA 6: Marcar instâncias mortas como desconectadas (SEM REMOVER VÍNCULOS)
    console.log('[Dedicated Sync] ⚰️ Marcando instâncias mortas...');
    for (const deadInstance of deadSupabaseInstances) {
      try {
        if (deadInstance.connection_status !== 'disconnected') {
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({
              connection_status: 'disconnected',
              web_status: 'disconnected',
              date_disconnected: new Date().toISOString(),
              updated_at: new Date().toISOString()
              // IMPORTANTE: NÃO remover company_id nem created_by_user_id - preservar vínculos
            })
            .eq('id', deadInstance.id);

          if (updateError) {
            console.error(`[Dedicated Sync] ❌ Erro ao marcar morta ${deadInstance.vps_instance_id}:`, updateError);
            syncResults.errors.push({ 
              vpsId: deadInstance.vps_instance_id, 
              error: updateError.message 
            });
          } else {
            console.log(`[Dedicated Sync] ✅ Marcada como morta (vínculos preservados): ${deadInstance.vps_instance_id}`);
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

    const executionTime = Date.now() - startTime;
    console.log(`[Dedicated Sync] ✅ Sincronização completa [${syncId}] em ${executionTime}ms:`);
    console.log(`[Dedicated Sync] - ${syncResults.added} adicionadas (created_by_user_id: NULL)`);
    console.log(`[Dedicated Sync] - ${syncResults.updated} atualizadas com dados completos`);
    console.log(`[Dedicated Sync] - ${syncResults.preserved_links} vínculos preservados`);
    console.log(`[Dedicated Sync] - ${syncResults.marked_dead} marcadas como mortas`);
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
          orphans_found: orphanVpsIds.length,
          dead_instances: deadSupabaseInstances.length,
          added: syncResults.added,
          updated: syncResults.updated,
          preserved_links: syncResults.preserved_links,
          marked_dead: syncResults.marked_dead,
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
