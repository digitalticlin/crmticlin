
import { corsHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';

export async function deleteWhatsAppInstance(supabase: any, instanceData: any, userId: string) {
  const deletionId = `delete_${Date.now()}`;
  console.log(`[Instance Deletion] 🗑️ Deletando instância [${deletionId}]:`, instanceData);

  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    // Buscar instância no banco
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      throw new Error('Instância não encontrada ou sem permissão');
    }

    // Deletar da VPS se tiver vps_instance_id
    if (instance.vps_instance_id) {
      const vpsResponse = await makeVPSRequest(`/instance/${instance.vps_instance_id}`, 'DELETE');
      console.log(`[Instance Deletion] VPS response [${deletionId}]:`, vpsResponse);
    }

    // Deletar do banco
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(`Erro ao deletar instância: ${deleteError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Instância deletada com sucesso',
        deletionId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Instance Deletion] ❌ Erro [${deletionId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        deletionId
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
