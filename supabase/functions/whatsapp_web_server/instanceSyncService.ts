
import { corsHeaders, VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequestService.ts';

export async function syncAllInstances(supabase: any, syncData: any, userId: string) {
  const syncId = `sync_${Date.now()}`;
  console.log(`[Instance Sync] 🔄 CORREÇÃO CRÍTICA - Iniciando sincronização [${syncId}]`);

  try {
    // Buscar todas as instâncias do usuário/empresa
    const { data: instances, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('created_by_user_id', userId)
      .eq('connection_type', 'web');

    if (instancesError) {
      throw new Error(`Erro ao buscar instâncias: ${instancesError.message}`);
    }

    console.log(`[Instance Sync] 📊 CORREÇÃO CRÍTICA - ${instances.length} instâncias encontradas`);

    // Buscar status de todas as instâncias na VPS
    let syncedCount = 0;
    let errorCount = 0;

    for (const instance of instances) {
      if (!instance.vps_instance_id) {
        console.log(`[Instance Sync] ⚠️ CORREÇÃO CRÍTICA - Instância ${instance.id} sem vps_instance_id`);
        continue;
      }

      try {
        const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/${instance.vps_instance_id}/status`, {
          method: 'GET',
          headers: getVPSHeaders()
        });

        if (vpsResponse.ok) {
          const vpsData = await vpsResponse.json();
          
          // Atualizar status no banco
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({
              connection_status: vpsData.status || 'unknown',
              updated_at: new Date().toISOString()
            })
            .eq('id', instance.id);

          if (!updateError) {
            syncedCount++;
            console.log(`[Instance Sync] ✅ CORREÇÃO CRÍTICA - Instância ${instance.instance_name} sincronizada`);
          }
        }
      } catch (error) {
        errorCount++;
        console.error(`[Instance Sync] ❌ CORREÇÃO CRÍTICA - Erro na instância ${instance.instance_name}:`, error);
      }
    }

    console.log(`[Instance Sync] 📈 CORREÇÃO CRÍTICA - Sincronização completa [${syncId}]: ${syncedCount} ok, ${errorCount} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        syncId,
        totalInstances: instances.length,
        syncedCount,
        errorCount,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Sync] ❌ CORREÇÃO CRÍTICA - Erro crítico [${syncId}]:`, error);
    
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
