
import { corsHeaders } from './config.ts';
import { getVPSInstances } from './vpsRequestService.ts';

export async function syncAllInstances(supabase: any, syncData: any, userId: string) {
  const syncId = `sync_${Date.now()}`;
  console.log(`[Instance Sync] 🔄 FASE 2.0 - Sincronizando instâncias [${syncId}]`);

  try {
    // 1. Buscar instâncias do usuário no banco
    const { data: dbInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('created_by_user_id', userId);

    if (dbError) {
      throw dbError;
    }

    console.log(`[Instance Sync] 📊 FASE 2.0 - Instâncias no banco [${syncId}]:`, dbInstances?.length || 0);

    // 2. Buscar instâncias da VPS
    const vpsResult = await getVPSInstances();
    const vpsInstances = vpsResult.instances || [];

    console.log(`[Instance Sync] 📊 FASE 2.0 - Instâncias na VPS [${syncId}]:`, vpsInstances.length);

    let updatedCount = 0;
    let addedCount = 0;

    // 3. Sincronizar status das instâncias existentes
    for (const dbInstance of dbInstances || []) {
      if (dbInstance.vps_instance_id) {
        const vpsInstance = vpsInstances.find(vps => vps.instanceId === dbInstance.vps_instance_id);
        
        if (vpsInstance) {
          // Atualizar status se diferente
          const updates: any = {};
          let hasChanges = false;

          if (vpsInstance.status && vpsInstance.status !== dbInstance.connection_status) {
            updates.connection_status = vpsInstance.status;
            updates.web_status = vpsInstance.status;
            hasChanges = true;
          }

          if (vpsInstance.phone && vpsInstance.phone !== dbInstance.phone) {
            updates.phone = vpsInstance.phone;
            hasChanges = true;
          }

          if (vpsInstance.profileName && vpsInstance.profileName !== dbInstance.profile_name) {
            updates.profile_name = vpsInstance.profileName;
            hasChanges = true;
          }

          if (hasChanges) {
            updates.updated_at = new Date().toISOString();

            const { error: updateError } = await supabase
              .from('whatsapp_instances')
              .update(updates)
              .eq('id', dbInstance.id);

            if (!updateError) {
              updatedCount++;
              console.log(`[Instance Sync] ✅ FASE 2.0 - Instância atualizada:`, dbInstance.instance_name);
            }
          }
        }
      }
    }

    console.log(`[Instance Sync] ✅ FASE 2.0 - Sincronização concluída [${syncId}]:`, {
      instanciasBanco: dbInstances?.length || 0,
      instanciasVPS: vpsInstances.length,
      atualizadas: updatedCount,
      adicionadas: addedCount
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          dbInstances: dbInstances?.length || 0,
          vpsInstances: vpsInstances.length,
          updated: updatedCount,
          added: addedCount
        },
        syncId,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Sync] 💥 FASE 2.0 - ERRO CRÍTICO [${syncId}]:`, {
      error: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        syncId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
