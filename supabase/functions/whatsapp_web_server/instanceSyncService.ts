
import { corsHeaders } from './config.ts';
import { getVPSInstanceStatus } from './vpsRequestService.ts';

export async function syncAllInstances(supabase: any, syncData: any, userId: string) {
  const syncId = `sync_${Date.now()}`;
  console.log(`[Instance Sync] 🔄 CORREÇÃO ROBUSTA - Sincronizando instâncias [${syncId}]`);

  try {
    // Buscar todas as instâncias do usuário
    const { data: instances, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('created_by_user_id', userId)
      .eq('connection_type', 'web');

    if (fetchError) {
      throw new Error(`Erro ao buscar instâncias: ${fetchError.message}`);
    }

    console.log(`[Instance Sync] 📊 CORREÇÃO - ${instances?.length || 0} instâncias encontradas`);

    let updated = 0;
    const errors: string[] = [];

    for (const instance of instances || []) {
      if (instance.vps_instance_id) {
        try {
          console.log(`[Instance Sync] 🔍 CORREÇÃO - Verificando status VPS: ${instance.vps_instance_id}`);
          
          const vpsStatus = await getVPSInstanceStatus(instance.vps_instance_id);
          
          if (vpsStatus.success) {
            // Atualizar status no banco se necessário
            const { error: updateError } = await supabase
              .from('whatsapp_instances')
              .update({
                connection_status: vpsStatus.status || instance.connection_status,
                updated_at: new Date().toISOString()
              })
              .eq('id', instance.id);

            if (!updateError) {
              updated++;
            }
          }
        } catch (error: any) {
          errors.push(`${instance.instance_name}: ${error.message}`);
        }
      }
    }

    console.log(`[Instance Sync] ✅ CORREÇÃO - Sincronização concluída [${syncId}]: ${updated} atualizadas`);

    return new Response(
      JSON.stringify({
        success: true,
        syncId,
        instancesFound: instances?.length || 0,
        instancesUpdated: updated,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Sync] ❌ CORREÇÃO - Erro geral [${syncId}]:`, error);
    
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
