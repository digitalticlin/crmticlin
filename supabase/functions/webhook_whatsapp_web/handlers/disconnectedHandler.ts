
export async function handleDisconnectedEvent(supabase: any, instanceId: string) {
  console.log('Handling disconnected event for instance:', instanceId);
  
  try {
    const { data: updateResult, error } = await supabase
      .from('whatsapp_instances')
      .update({
        web_status: 'disconnected',
        connection_status: 'disconnected',
        date_disconnected: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId)
      .select();

    if (error) {
      console.error('Error updating disconnected status:', error);
      throw error;
    }

    console.log('Instance disconnected successfully:', updateResult);
  } catch (error) {
    console.error('Failed to handle disconnected event:', error);
    throw error;
  }
}
