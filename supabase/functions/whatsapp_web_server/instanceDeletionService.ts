
import { corsHeaders } from './config.ts';
import { deleteVPSInstance } from './vpsRequestService.ts';

export async function deleteWhatsAppInstance(supabase: any, instanceData: any, userId: string) {
  const deleteId = `delete_${Date.now()}`;
  console.log(`[Instance Deletion] 🗑️ CORREÇÃO CRÍTICA - Deleting WhatsApp Web.js instance [${deleteId}]:`, { instanceId: instanceData.instanceId });

  try {
    const { instanceId } = instanceData;
    
    if (!instanceId || typeof instanceId !== 'string') {
      throw new Error(`Instance ID inválido: ${instanceId}`);
    }

    console.log(`[Instance Deletion] 📋 CORREÇÃO CRÍTICA - Validating instance ID: ${instanceId}`);

    // 1. Buscar instância no Supabase
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError) {
      console.error(`[Instance Deletion] ❌ CORREÇÃO CRÍTICA - Error fetching instance:`, instanceError);
      throw new Error(`Erro ao buscar instância: ${instanceError.message}`);
    }

    if (!instance) {
      console.error(`[Instance Deletion] ❌ CORREÇÃO CRÍTICA - Instance not found for user: ${userId}`);
      throw new Error('Instância não encontrada ou sem permissão');
    }

    console.log(`[Instance Deletion] ✅ CORREÇÃO CRÍTICA - Instance found:`, {
      id: instance.id,
      vpsInstanceId: instance.vps_instance_id,
      instanceName: instance.instance_name
    });

    // 2. Deletar da VPS se tiver vps_instance_id
    if (instance.vps_instance_id) {
      console.log(`[Instance Deletion] 🌐 CORREÇÃO CRÍTICA - Deleting from VPS: ${instance.vps_instance_id}`);
      const vpsResult = await deleteVPSInstance(instance.vps_instance_id, instance.instance_name);
      
      if (!vpsResult.success) {
        console.warn(`[Instance Deletion] ⚠️ CORREÇÃO CRÍTICA - VPS deletion failed: ${vpsResult.error}`);
        // Continuar com a deleção no Supabase mesmo se a VPS falhar
      } else {
        console.log(`[Instance Deletion] ✅ CORREÇÃO CRÍTICA - Successfully deleted from VPS`);
      }
    } else {
      console.log(`[Instance Deletion] ⏭️ CORREÇÃO CRÍTICA - No VPS instance ID, skipping VPS deletion`);
    }

    // 3. Deletar do Supabase
    console.log(`[Instance Deletion] 🗄️ CORREÇÃO CRÍTICA - Deleting from Supabase: ${instanceId}`);
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId)
      .eq('created_by_user_id', userId);

    if (deleteError) {
      console.error(`[Instance Deletion] ❌ CORREÇÃO CRÍTICA - Error deleting from Supabase:`, deleteError);
      throw deleteError;
    }

    console.log(`[Instance Deletion] ✅ CORREÇÃO CRÍTICA - Instance deleted successfully [${deleteId}]`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Instância deletada com sucesso',
        deletionId: deleteId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Deletion] 💥 CORREÇÃO CRÍTICA - ERRO GERAL [${deleteId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        action: 'delete_instance',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
