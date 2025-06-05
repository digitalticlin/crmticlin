
import { WhatsAppInstance, ConnectionData } from './types.ts';

export async function processConnectionUpdate(supabase: any, instance: WhatsAppInstance, connectionData: ConnectionData) {
  console.log('[Connection Processor] 🔌 Processing connection update');
  
  try {
    const { connection, lastDisconnect } = connectionData;
    
    // Atualizar status da instância
    const updateData: any = {
      connection_status: connection?.state || 'unknown',
      updated_at: new Date().toISOString()
    };

    if (connection?.state === 'open') {
      updateData.date_connected = new Date().toISOString();
      updateData.web_status = 'connected';
    } else if (connection?.state === 'close') {
      updateData.date_disconnected = new Date().toISOString();
      updateData.web_status = 'disconnected';
    }

    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', instance.id);

    if (updateError) {
      console.error('[Connection Processor] ❌ Error updating status:', updateError);
      throw updateError;
    }

    console.log('[Connection Processor] ✅ Status updated:', updateData);
    return {
      success: true,
      processed: true
    };

  } catch (error) {
    console.error('[Connection Processor] ❌ Error processing connection:', error);
    throw error;
  }
}
