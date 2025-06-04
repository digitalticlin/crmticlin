
// FASE 3: Handlers para eventos de instância
export async function handleInstanceCreatedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook FASE 3] 🆕 Instance created event:', instanceId);
  
  try {
    // Log the event but don't create automatically - let sync handle adoption
    console.log('[Webhook FASE 3] 📝 Instance created on VPS, will be adopted by sync process');
  } catch (error) {
    console.error('[Webhook FASE 3] ❌ Exception in handleInstanceCreatedEvent:', error);
  }
}

export async function handleInstanceDestroyedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook FASE 3] 🗑️ Instance destroyed event:', instanceId);
  
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
      console.error('[Webhook FASE 3] ❌ Error updating destroyed status:', error);
    } else {
      console.log('[Webhook FASE 3] ✅ Instance marked as destroyed');
    }
  } catch (error) {
    console.error('[Webhook FASE 3] ❌ Exception in handleInstanceDestroyedEvent:', error);
  }
}

export async function handleDisconnectedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook FASE 3] 🔌 Disconnected event for instance:', instanceId);
  
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
      console.error('[Webhook FASE 3] ❌ Error updating disconnected status:', error);
    } else {
      console.log('[Webhook FASE 3] ✅ Instance marked as disconnected');
    }
  } catch (error) {
    console.error('[Webhook FASE 3] ❌ Exception in handleDisconnectedEvent:', error);
  }
}

export async function handleAuthFailureEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook FASE 3] ❌ Auth failure event for instance:', instanceId);
  
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
      console.error('[Webhook FASE 3] ❌ Error updating auth failure status:', error);
    } else {
      console.log('[Webhook FASE 3] ✅ Auth failure status updated');
    }
  } catch (error) {
    console.error('[Webhook FASE 3] ❌ Exception in handleAuthFailureEvent:', error);
  }
}
