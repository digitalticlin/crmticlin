
import { corsHeaders } from './config.ts';
import { deleteVPSInstance } from './vpsRequestService.ts';

export async function deleteWhatsAppInstance(supabase: any, instanceId: string) {
  console.log('[Instance Deletion] 🗑️ Deleting WhatsApp Web.js instance:', instanceId);

  try {
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id, instance_name')
      .eq('id', instanceId)
      .single();

    if (!instance?.vps_instance_id) {
      console.log('[Instance Deletion] No VPS instance ID found, only deleting from database');
    } else {
      try {
        console.log('[Instance Deletion] Deleting from VPS with corrected authentication');
        await deleteVPSInstance(instance.vps_instance_id, instance.instance_name);
        console.log('[Instance Deletion] Successfully deleted from VPS');
      } catch (deleteError) {
        console.error('[Instance Deletion] VPS delete error:', deleteError);
        // Continue with database deletion even if VPS delete fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(`Database delete error: ${deleteError.message}`);
    }

    console.log('[Instance Deletion] Instance successfully deleted from database');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Instance Deletion] 💥 ERRO GERAL:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        action: 'deletion_error_handling',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
