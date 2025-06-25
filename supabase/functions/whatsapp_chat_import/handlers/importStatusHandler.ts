
export async function handleImportStatus(supabase: any, user: any, body: any) {
  const { instanceId } = body;
  
  if (!instanceId) {
    return {
      success: false,
      error: 'instanceId is required',
      status: 400
    };
  }

  // Find import data
  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('last_sync_at, created_at')
    .eq('id', instanceId)
    .eq('created_by_user_id', user.id)
    .single();

  const { count: contactsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('whatsapp_number_id', instanceId);

  const { count: messagesCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('whatsapp_number_id', instanceId);

  return {
    success: true,
    status: {
      lastSyncAt: instance?.last_sync_at,
      contactsImported: contactsCount || 0,
      messagesImported: messagesCount || 0,
      instanceCreatedAt: instance?.created_at
    },
    status: 200
  };
}
