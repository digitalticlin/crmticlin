
import { corsHeaders } from './config.ts';
import { deleteVPSInstance } from './vpsRequestService.ts';

export async function deleteWhatsAppInstance(supabase: any, instanceId: string) {
  console.log('[Instance Deletion] 🗑️ Deleting WhatsApp Web.js instance:', instanceId);

  try {
    // Buscar dados da instância antes de deletar
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id, instance_name, phone')
      .eq('id', instanceId)
      .single();

    if (fetchError) {
      console.error('[Instance Deletion] ❌ Error fetching instance:', fetchError);
      throw new Error(`Erro ao buscar instância: ${fetchError.message}`);
    }

    if (!instance) {
      console.error('[Instance Deletion] ❌ Instance not found:', instanceId);
      throw new Error('Instância não encontrada');
    }

    console.log('[Instance Deletion] 📱 Instance found:', {
      id: instanceId,
      vps_instance_id: instance.vps_instance_id,
      instance_name: instance.instance_name,
      phone: instance.phone
    });

    // Tentar deletar da VPS se houver vps_instance_id
    if (instance.vps_instance_id) {
      try {
        console.log('[Instance Deletion] 🌐 Deleting from VPS:', instance.vps_instance_id);
        await deleteVPSInstance(instance.vps_instance_id, instance.instance_name);
        console.log('[Instance Deletion] ✅ Successfully deleted from VPS');
      } catch (deleteError) {
        console.error('[Instance Deletion] ⚠️ VPS delete error (continuing):', deleteError);
        // Continue com a deleção do banco mesmo se a VPS falhar
      }
    } else {
      console.log('[Instance Deletion] ℹ️ No VPS instance ID, skipping VPS deletion');
    }

    // Deletar do banco de dados
    console.log('[Instance Deletion] 🗄️ Deleting from database:', instanceId);
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      console.error('[Instance Deletion] ❌ Database delete error:', deleteError);
      throw new Error(`Erro ao deletar do banco: ${deleteError.message}`);
    }

    console.log('[Instance Deletion] ✅ Instance successfully deleted from database');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Instância deletada com sucesso',
        deletedInstance: {
          id: instanceId,
          instance_name: instance.instance_name,
          phone: instance.phone
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Instance Deletion] 💥 ERRO GERAL:', error);
    
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
