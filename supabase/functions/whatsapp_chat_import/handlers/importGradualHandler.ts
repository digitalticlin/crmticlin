
import { importHistoryFromVPS } from '../services/importService.ts';

export async function handleImportGradual(supabase: any, body: any) {
  const { instanceId, vpsInstanceId } = body;
  
  console.log(`[Import Gradual Handler] 🔍 Parameters received:`, { instanceId, vpsInstanceId });
  
  if (!instanceId && !vpsInstanceId) {
    return {
      success: false,
      error: 'instanceId or vpsInstanceId is required',
      status: 400
    };
  }

  // Find instance by ID or VPS ID
  const query = supabase.from('whatsapp_instances').select('*');
  if (instanceId) {
    query.eq('id', instanceId);
  } else {
    query.eq('vps_instance_id', vpsInstanceId);
  }
  
  const { data: instance, error: instanceError } = await query.single();

  if (instanceError || !instance) {
    console.error(`[Import Gradual Handler] ❌ Instance not found:`, { instanceId, vpsInstanceId, error: instanceError });
    return {
      success: false,
      error: 'Instance not found',
      status: 404
    };
  }

  console.log(`[Import Gradual Handler] ✅ Instance found:`, {
    id: instance.id,
    name: instance.instance_name,
    vpsInstanceId: instance.vps_instance_id
  });

  console.log(`[Import Gradual Handler] 🚀 Automatic import started for: ${instance.instance_name}`);

  const result = await importHistoryFromVPS(supabase, instance, 'both', 25);

  // Update timestamp
  await supabase
    .from('whatsapp_instances')
    .update({
      last_sync_at: new Date().toISOString(),
      history_imported: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', instance.id);

  console.log(`[Import Gradual Handler] ✅ Automatic import completed:`, {
    contactsImported: result.contactsImported,
    messagesImported: result.messagesImported,
    totalImported: result.contactsImported + result.messagesImported
  });

  return {
    success: result.success,
    message: result.message || 'Automatic import completed',
    contactsImported: result.contactsImported,
    messagesImported: result.messagesImported,
    totalImported: result.contactsImported + result.messagesImported,
    error: result.success ? undefined : result.error,
    status: 200
  };
}
