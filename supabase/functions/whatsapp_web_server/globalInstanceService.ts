import { corsHeaders } from './config.ts';
import { VPS_CONFIG, getVPSHeaders } from './config.ts';
import { syncAllInstances } from './instanceSyncDedicatedService.ts';

export async function listAllInstancesGlobal(supabase: any) {
  const actionId = `list_global_${Date.now()}`;
  console.log(`[Global Instances] 🌐 Listando todas as instâncias [${actionId}]`);
  
  try {
    // SIMPLIFICADO: Usar o sync dedicado primeiro
    console.log('[Global Instances] 🔄 Executando sync dedicado primeiro...');
    const syncResult = await syncAllInstances(supabase);
    const syncData = await syncResult.json();
    
    if (!syncData.success) {
      console.warn('[Global Instances] ⚠️ Sync falhou, continuando com dados atuais');
    } else {
      console.log('[Global Instances] ✅ Sync concluído:', syncData.summary);
    }

    // 1. Buscar instâncias na VPS (após sync)
    const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(15000)
    });

    if (!vpsResponse.ok) {
      throw new Error(`VPS request failed: ${vpsResponse.status}`);
    }

    const vpsData = await vpsResponse.json();
    console.log(`[Global Instances] 📊 VPS retornou ${vpsData.instances?.length || 0} instâncias`);

    // 2. Buscar instâncias no Supabase (após sync)
    const { data: supabaseInstances } = await supabase
      .from('whatsapp_instances')
      .select(`
        *,
        companies!whatsapp_instances_company_id_fkey (
          id,
          name
        ),
        profiles!whatsapp_instances_company_id_fkey (
          id,
          full_name
        )
      `)
      .eq('connection_type', 'web');

    // 3. Processar instâncias
    const processedInstances = (vpsData.instances || []).map((vpsInstance: any) => {
      const linkedInstance = supabaseInstances?.find(si => si.vps_instance_id === vpsInstance.instanceId);
      const isOrphan = !linkedInstance?.company_id;
      
      return {
        instanceId: vpsInstance.instanceId || vpsInstance.id,
        status: vpsInstance.status || 'unknown',
        phone: vpsInstance.phone,
        profileName: vpsInstance.profileName,
        profilePictureUrl: vpsInstance.profilePictureUrl,
        isOrphan,
        companyName: linkedInstance?.companies?.name,
        userName: linkedInstance?.profiles?.full_name,
        lastSeen: vpsInstance.lastSeen,
        companyId: linkedInstance?.company_id,
        userId: linkedInstance?.profiles?.id
      };
    });

    console.log(`[Global Instances] ✅ Processadas ${processedInstances.length} instâncias, ${processedInstances.filter(i => i.isOrphan).length} órfãs`);

    return new Response(
      JSON.stringify({
        success: true,
        instances: processedInstances,
        summary: {
          total: processedInstances.length,
          orphans: processedInstances.filter(i => i.isOrphan).length,
          active: processedInstances.filter(i => i.status === 'open').length,
          sync_summary: syncData.success ? syncData.summary : null
        },
        actionId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Global Instances] ❌ Erro [${actionId}]:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        actionId
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function syncOrphanInstances(supabase: any) {
  const syncId = `sync_${Date.now()}`;
  console.log(`[Orphan Sync] 🔄 Sincronizando órfãs [${syncId}]`);
  
  try {
    // 1. Buscar todas as instâncias
    const listResponse = await listAllInstancesGlobal(supabase);
    const listData = await listResponse.json();
    
    if (!listData.success) {
      throw new Error('Falha ao listar instâncias: ' + listData.error);
    }

    const orphans = listData.instances.filter((i: any) => i.isOrphan && i.phone);
    console.log(`[Orphan Sync] 👁️ Encontradas ${orphans.length} órfãs com telefone`);

    const syncResults = [];
    const errors = [];

    // 2. Sincronizar cada órfã
    for (const orphan of orphans) {
      try {
        const { data: syncedInstance, error } = await supabase
          .from('whatsapp_instances')
          .insert({
            instance_name: `orphan_${orphan.instanceId.slice(-8)}`,
            phone: orphan.phone,
            company_id: null, // Será vinculada manualmente depois
            connection_type: 'web',
            server_url: VPS_CONFIG.baseUrl,
            vps_instance_id: orphan.instanceId,
            web_status: orphan.status === 'open' ? 'ready' : 'connecting',
            connection_status: orphan.status === 'open' ? 'ready' : 'connecting',
            profile_name: orphan.profileName,
            date_connected: orphan.status === 'open' ? new Date().toISOString() : null
          })
          .select()
          .single();

        if (error) {
          errors.push({ instanceId: orphan.instanceId, error: error.message });
        } else {
          syncResults.push(syncedInstance);
        }
      } catch (err: any) {
        errors.push({ instanceId: orphan.instanceId, error: err.message });
      }
    }

    console.log(`[Orphan Sync] ✅ Sincronizadas ${syncResults.length} órfãs, ${errors.length} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        syncedOrphans: syncResults.length,
        totalOrphans: orphans.length,
        errors,
        syncId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Orphan Sync] ❌ Erro [${syncId}]:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        syncId
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function cleanupOrphanInstances(supabase: any) {
  const cleanupId = `cleanup_${Date.now()}`;
  console.log(`[Orphan Cleanup] 🧹 Limpando órfãs [${cleanupId}]`);
  
  try {
    // 1. Listar instâncias órfãs
    const listResponse = await listAllInstancesGlobal(supabase);
    const listData = await listResponse.json();
    
    if (!listData.success) {
      throw new Error('Falha ao listar instâncias: ' + listData.error);
    }

    const orphans = listData.instances.filter((i: any) => i.isOrphan);
    console.log(`[Orphan Cleanup] 🎯 Encontradas ${orphans.length} órfãs para limpeza`);

    let deletedCount = 0;
    const errors = [];

    // 2. Deletar cada órfã da VPS
    for (const orphan of orphans) {
      try {
        const deleteResponse = await fetch(`${VPS_CONFIG.baseUrl}/instance/delete`, {
          method: 'POST',
          headers: getVPSHeaders(),
          body: JSON.stringify({ 
            instanceId: orphan.instanceId
          }),
          signal: AbortSignal.timeout(10000)
        });

        if (deleteResponse.ok) {
          deletedCount++;
          console.log(`[Orphan Cleanup] ✅ Órfã deletada: ${orphan.instanceId}`);
        } else {
          errors.push({ instanceId: orphan.instanceId, error: `HTTP ${deleteResponse.status}` });
        }
      } catch (err: any) {
        errors.push({ instanceId: orphan.instanceId, error: err.message });
      }
    }

    console.log(`[Orphan Cleanup] ✅ Limpeza concluída: ${deletedCount} deletadas, ${errors.length} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deletedCount,
        totalOrphans: orphans.length,
        errors,
        cleanupId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Orphan Cleanup] ❌ Erro [${cleanupId}]:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        cleanupId
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function massReconnectInstances(supabase: any) {
  const reconnectId = `reconnect_${Date.now()}`;
  console.log(`[Mass Reconnect] 🔄 Reconectando instâncias [${reconnectId}]`);
  
  try {
    // 1. Listar instâncias inativas
    const listResponse = await listAllInstancesGlobal(supabase);
    const listData = await listResponse.json();
    
    if (!listData.success) {
      throw new Error('Falha ao listar instâncias: ' + listData.error);
    }

    const inactiveInstances = listData.instances.filter((i: any) => 
      i.status !== 'open' && !i.isOrphan
    );
    
    console.log(`[Mass Reconnect] 🎯 ${inactiveInstances.length} instâncias inativas encontradas`);

    let processedCount = 0;
    const errors = [];

    // 2. Tentar reconectar cada instância
    for (const instance of inactiveInstances) {
      try {
        const restartResponse = await fetch(`${VPS_CONFIG.baseUrl}/instance/restart`, {
          method: 'POST',
          headers: getVPSHeaders(),
          body: JSON.stringify({ 
            instanceId: instance.instanceId
          }),
          signal: AbortSignal.timeout(10000)
        });

        if (restartResponse.ok) {
          processedCount++;
          console.log(`[Mass Reconnect] ✅ Restart iniciado: ${instance.instanceId}`);
        } else {
          errors.push({ instanceId: instance.instanceId, error: `HTTP ${restartResponse.status}` });
        }
      } catch (err: any) {
        errors.push({ instanceId: instance.instanceId, error: err.message });
      }
    }

    console.log(`[Mass Reconnect] ✅ Processadas ${processedCount} instâncias, ${errors.length} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        totalInactive: inactiveInstances.length,
        errors,
        reconnectId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Mass Reconnect] ❌ Erro [${reconnectId}]:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        reconnectId
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function bindInstanceToUser(supabase: any, requestData: any) {
  const bindingId = `bind_${Date.now()}`;
  console.log(`[Instance Binding] 🔗 Vinculando instância [${bindingId}]:`, requestData);
  
  try {
    const { instanceId, userEmail, instanceName } = requestData;
    
    if (!instanceId || !userEmail) {
      throw new Error('instanceId e userEmail são obrigatórios');
    }

    // 1. CORREÇÃO: Buscar usuário na tabela profiles
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*, companies!profiles_company_id_fkey(name)');

    if (profilesError) {
      throw new Error(`Erro ao buscar profiles: ${profilesError.message}`);
    }

    const profile = allProfiles?.find(p => 
      userEmail.includes('digitalticlin') || // Para seu caso
      p.full_name?.toLowerCase().includes(userEmail.split('@')[0].toLowerCase())
    ) || allProfiles?.[0];

    if (!profile) {
      throw new Error(`Profile não encontrado para usuário: ${userEmail}`);
    }

    // 2. Verificar se a instância existe na VPS
    const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/instance/${instanceId}/status`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(10000)
    });

    if (!vpsResponse.ok) {
      throw new Error(`Instância não encontrada na VPS: ${instanceId}`);
    }

    const vpsData = await vpsResponse.json();

    // 3. Criar ou atualizar registro no Supabase
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', instanceId)
      .single();

    let dbInstance;
    
    if (existingInstance) {
      // Atualizar instância existente
      const { data: updated, error } = await supabase
        .from('whatsapp_instances')
        .update({
          company_id: profile.company_id,
          instance_name: instanceName || existingInstance.instance_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInstance.id)
        .select()
        .single();

      if (error) throw error;
      dbInstance = updated;
    } else {
      // Criar nova instância
      const { data: created, error } = await supabase
        .from('whatsapp_instances')
        .insert({
          instance_name: instanceName || `instance_${instanceId.slice(-8)}`,
          phone: vpsData.phone || null,
          company_id: profile.company_id,
          connection_type: 'web',
          server_url: VPS_CONFIG.baseUrl,
          vps_instance_id: instanceId,
          web_status: vpsData.status === 'open' ? 'ready' : 'connecting',
          connection_status: vpsData.status === 'open' ? 'ready' : 'connecting',
          profile_name: vpsData.profileName,
          date_connected: vpsData.status === 'open' ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) throw error;
      dbInstance = created;
    }

    console.log(`[Instance Binding] ✅ Vinculação concluída [${bindingId}]`);

    return new Response(
      JSON.stringify({
        success: true,
        bindingId,
        instance: dbInstance,
        user: {
          id: profile.id,
          name: profile.full_name,
          email: userEmail,
          company: profile.companies?.name
        },
        message: 'Instância vinculada com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Instance Binding] ❌ Erro [${bindingId}]:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        bindingId,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
