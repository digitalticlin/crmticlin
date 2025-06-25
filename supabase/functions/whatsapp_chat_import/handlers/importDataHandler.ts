
import { importHistoryFromVPS } from '../services/importService.ts';

interface ImportRequest {
  instanceId: string;
  importType: 'contacts' | 'messages' | 'both';
  batchSize?: number;
  lastSyncTimestamp?: string;
}

export async function handleImportData(supabase: any, user: any, body: ImportRequest) {
  const { instanceId, importType = 'both', batchSize = 30, lastSyncTimestamp } = body;
  
  if (!instanceId) {
    return {
      success: false,
      error: 'instanceId is required',
      status: 400
    };
  }

  // Find instance
  const { data: instance, error: instanceError } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('id', instanceId)
    .eq('created_by_user_id', user.id)
    .single();

  if (instanceError || !instance) {
    return {
      success: false,
      error: 'Instance not found',
      status: 404
    };
  }

  if (!['ready', 'open', 'connected'].includes(instance.connection_status)) {
    return {
      success: false,
      error: `Instance not connected. Status: ${instance.connection_status}`,
      status: 400
    };
  }

  console.log(`[Import Data Handler] 🚀 Starting import ${importType} for: ${instance.instance_name}`);

  const result = await importHistoryFromVPS(supabase, instance, importType, batchSize, lastSyncTimestamp);

  // Update last sync timestamp
  const { error: updateError } = await supabase
    .from('whatsapp_instances')
    .update({
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', instanceId);

  if (updateError) {
    console.warn(`[Import Data Handler] ⚠️ Error updating timestamp:`, updateError);
  }

  console.log(`[Import Data Handler] 🎉 Import completed: ${result.totalImported} items imported`);

  return {
    success: result.success,
    message: result.message,
    results: {
      contacts: { success: true, imported: result.contactsImported, message: `${result.contactsImported} contacts imported` },
      messages: { success: true, imported: result.messagesImported, message: `${result.messagesImported} messages imported` }
    },
    summary: {
      totalImported: result.totalImported,
      contactsImported: result.contactsImported,
      messagesImported: result.messagesImported,
      importType,
      timestamp: new Date().toISOString()
    },
    status: 200
  };
}
