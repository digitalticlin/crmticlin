
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function handleInstanceCreatedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 🆕 Handling instance creation event for:', instanceId);
  
  try {
    // Verificar se a instância já existe no banco
    const { data: existingInstance, error: checkError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', instanceId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[Webhook] ❌ Error checking existing instance:', checkError);
      return;
    }

    if (existingInstance) {
      console.log('[Webhook] ℹ️ Instance already exists in database:', instanceId);
      
      // Atualizar status para 'connecting' se necessário
      if (existingInstance.connection_status !== 'connecting') {
        await supabase
          .from('whatsapp_instances')
          .update({
            connection_status: 'connecting',
            web_status: 'initializing',
            updated_at: new Date().toISOString()
          })
          .eq('vps_instance_id', instanceId);
        
        console.log('[Webhook] ✅ Updated existing instance status to connecting');
      }
    } else {
      console.log('[Webhook] 🔍 Instance not found in database, will be handled by sync process');
      // A instância será detectada e adotada pelo processo de sync
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleInstanceCreatedEvent:', error);
  }
}

export async function handleInstanceDestroyedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 🗑️ Handling instance destruction event for:', instanceId);
  
  try {
    // Marcar a instância como desconectada ao invés de excluir
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        connection_status: 'disconnected',
        web_status: 'destroyed',
        date_disconnected: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook] ❌ Error updating destroyed instance:', error);
    } else {
      console.log('[Webhook] ✅ Instance marked as destroyed successfully for:', instanceId);
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleInstanceDestroyedEvent:', error);
  }
}

export async function handleDisconnectedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 🔌 Handling disconnected event for instance:', instanceId);
  
  try {
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        web_status: 'disconnected',
        connection_status: 'disconnected',
        date_disconnected: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook] ❌ Error updating disconnected status:', error);
    } else {
      console.log('[Webhook] ✅ Disconnected status updated successfully for:', instanceId);
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleDisconnectedEvent:', error);
  }
}

export async function handleAuthFailureEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 🚨 Handling auth failure event for instance:', instanceId);
  
  try {
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        web_status: 'auth_failure',
        connection_status: 'auth_failure',
        qr_code: null,
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook] ❌ Error updating auth failure status:', error);
    } else {
      console.log('[Webhook] ✅ Auth failure status updated successfully for:', instanceId);
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleAuthFailureEvent:', error);
  }
}
