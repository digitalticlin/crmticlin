
import { fetchHistoryFromVPS } from './vpsService.ts';
import { processContacts } from './contactService.ts';
import { processMessages } from './messageService.ts';

export async function importHistoryFromVPS(supabase: any, instance: any, importType: string = 'both', batchSize: number = 50, lastSyncTimestamp?: string) {
  console.log(`[Import Service] 📚 Importing history for instance: ${instance.instance_name}`);
  console.log(`[Import Service] 🔍 VPS Instance ID: "${instance.vps_instance_id}"`);
  console.log(`[Import Service] 🔍 Import Type: ${importType}, Batch Size: ${batchSize}`);

  // Critical validation: Check if vps_instance_id exists and is not empty
  if (!instance.vps_instance_id || instance.vps_instance_id.trim() === '') {
    console.error(`[Import Service] ❌ ERROR: vps_instance_id is empty or null for instance ${instance.instance_name}`);
    return {
      success: false,
      error: 'VPS Instance ID not found for this instance',
      contactsImported: 0,
      messagesImported: 0
    };
  }

  try {
    console.log(`[Import Service] 🚀 Starting VPS data fetch for: ${instance.vps_instance_id}`);
    
    const data = await fetchHistoryFromVPS(instance.vps_instance_id, importType, batchSize, lastSyncTimestamp);

    console.log(`[Import Service] ✅ VPS response received successfully:`, {
      contactsCount: data.contacts?.length || 0,
      messagesCount: data.messages?.length || 0
    });

    // Process contacts and messages
    const contactsImported = await processContacts(supabase, data.contacts, instance);
    const messagesImported = await processMessages(supabase, data.messages, instance);

    console.log(`[Import Service] ✅ Import completed: ${contactsImported} contacts, ${messagesImported} messages`);
    
    return {
      success: true,
      contactsImported,
      messagesImported,
      totalImported: contactsImported + messagesImported,
      message: `${contactsImported} contacts and ${messagesImported} messages imported`
    };

  } catch (error: any) {
    console.error(`[Import Service] ❌ Import error:`, error.message);
    console.error(`[Import Service] ❌ Stack trace:`, error.stack);
    return {
      success: false,
      error: error.message,
      contactsImported: 0,
      messagesImported: 0
    };
  }
}
