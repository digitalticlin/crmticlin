
// FASE 1: Handlers para eventos de instância com logs melhorados
export async function handleInstanceCreatedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook FASE 1] 🆕 Instance created event:', instanceId);
  console.log('[Webhook FASE 1] 📋 Creation data:', JSON.stringify(data, null, 2));
  
  try {
    // Log the event but don't create automatically - let sync handle adoption
    console.log('[Webhook FASE 1] 📝 Instance created on VPS, will be adopted by sync process');
  } catch (error) {
    console.error('[Webhook FASE 1] ❌ Exception in handleInstanceCreatedEvent:', error);
  }
}

export async function handleInstanceDestroyedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook FASE 1] 🗑️ Instance destroyed event:', instanceId);
  console.log('[Webhook FASE 1] 📋 Destruction data:', JSON.stringify(data, null, 2));
  
  try {
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        connection_status: 'disconnected',
        web_status: 'disconnected',
        date_disconnected: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook FASE 1] ❌ Error updating destroyed status:', error);
    } else {
      console.log('[Webhook FASE 1] ✅ Instance marked as destroyed');
    }
  } catch (error) {
    console.error('[Webhook FASE 1] ❌ Exception in handleInstanceDestroyedEvent:', error);
  }
}

export async function handleDisconnectedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook FASE 1] 🔌 Disconnected event for instance:', instanceId);
  console.log('[Webhook FASE 1] 📋 Disconnection data:', JSON.stringify(data, null, 2));
  
  try {
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        connection_status: 'disconnected',
        web_status: 'disconnected',
        date_disconnected: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook FASE 1] ❌ Error updating disconnected status:', error);
    } else {
      console.log('[Webhook FASE 1] ✅ Instance marked as disconnected');
    }
  } catch (error) {
    console.error('[Webhook FASE 1] ❌ Exception in handleDisconnectedEvent:', error);
  }
}

export async function handleAuthFailureEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook FASE 1] ❌ Auth failure event for instance:', instanceId);
  console.log('[Webhook FASE 1] 📋 Failure data:', JSON.stringify(data, null, 2));
  
  try {
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        connection_status: 'error',
        web_status: 'auth_failure',
        qr_code: null,
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook FASE 1] ❌ Error updating auth failure status:', error);
    } else {
      console.log('[Webhook FASE 1] ✅ Auth failure status updated');
    }
  } catch (error) {
    console.error('[Webhook FASE 1] ❌ Exception in handleAuthFailureEvent:', error);
  }
}
