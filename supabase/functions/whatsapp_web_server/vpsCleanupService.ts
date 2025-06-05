
import { corsHeaders } from './config.ts';
import { deleteVPSInstance } from './vpsRequestService.ts';

export async function deleteVPSInstanceCleanup(supabase: any, vpsInstanceId: string, instanceName: string) {
  const cleanupId = `cleanup_${Date.now()}`;
  console.log(`[VPS Cleanup] 🧹 LIMPEZA DE INSTÂNCIA VPS [${cleanupId}]`);
  console.log(`[VPS Cleanup] VPS Instance ID: ${vpsInstanceId}`);
  console.log(`[VPS Cleanup] Instance Name: ${instanceName}`);

  try {
    // Tentar deletar da VPS usando o vps_instance_id
    console.log(`[VPS Cleanup] 🗑️ Deletando instância da VPS: ${vpsInstanceId}`);
    
    const deleteResult = await deleteVPSInstance(vpsInstanceId, instanceName);
    
    if (deleteResult.success) {
      console.log(`[VPS Cleanup] ✅ Instância ${vpsInstanceId} deletada com sucesso da VPS`);
      
      // Log de sucesso
      await supabase
        .from('sync_logs')
        .insert({
          function_name: 'vps_cleanup_service',
          status: 'success',
          result: {
            cleanupId,
            vpsInstanceId,
            instanceName,
            message: 'Instância deletada com sucesso da VPS'
          }
        });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Instância deletada com sucesso da VPS',
          cleanupId,
          vpsInstanceId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } else {
      console.error(`[VPS Cleanup] ❌ Erro ao deletar da VPS: ${deleteResult.error}`);
      
      // Log de erro mas não falhar - a instância já foi removida do Supabase
      await supabase
        .from('sync_logs')
        .insert({
          function_name: 'vps_cleanup_service',
          status: 'warning',
          error_message: deleteResult.error,
          result: {
            cleanupId,
            vpsInstanceId,
            instanceName,
            message: 'Instância removida do Supabase mas erro ao deletar da VPS'
          }
        });

      return new Response(
        JSON.stringify({
          success: true,
          warning: true,
          message: 'Instância removida do Supabase, mas erro ao deletar da VPS',
          error: deleteResult.error,
          cleanupId,
          vpsInstanceId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error(`[VPS Cleanup] 💥 ERRO GERAL [${cleanupId}]:`, error);
    
    // Log do erro
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'vps_cleanup_service',
        status: 'error',
        error_message: error.message,
        result: {
          cleanupId,
          vpsInstanceId,
          instanceName
        }
      });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        cleanupId,
        vpsInstanceId
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
