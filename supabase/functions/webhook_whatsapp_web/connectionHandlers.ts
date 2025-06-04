
// FASE 3: Handlers otimizados para eventos de conexão
export async function handleQREvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook FASE 3] 📱 QR Code event for instance:', instanceId);
  
  try {
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: data.qr,
        connection_status: 'waiting_scan',
        web_status: 'waiting_scan',
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook FASE 3] ❌ Error updating QR:', error);
    } else {
      console.log('[Webhook FASE 3] ✅ QR Code updated successfully');
    }
  } catch (error) {
    console.error('[Webhook FASE 3] ❌ Exception in handleQREvent:', error);
  }
}

export async function handleAuthenticatedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook FASE 3] 🔐 Authenticated event for instance:', instanceId);
  
  try {
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        connection_status: 'connecting',
        web_status: 'authenticated',
        qr_code: null, // Clear QR code after authentication
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook FASE 3] ❌ Error updating authentication status:', error);
    } else {
      console.log('[Webhook FASE 3] ✅ Authentication status updated');
    }
  } catch (error) {
    console.error('[Webhook FASE 3] ❌ Exception in handleAuthenticatedEvent:', error);
  }
}

export async function handleReadyEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook FASE 3] ✅ Ready event for instance:', instanceId, 'Data:', data);
  
  try {
    const updateData: any = {
      connection_status: 'ready',
      web_status: 'ready',
      date_connected: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Extrair informações do usuário se disponíveis
    if (data.user) {
      if (data.user.id) {
        updateData.owner_jid = data.user.id;
      }
      if (data.user.name) {
        updateData.profile_name = data.user.name;
      }
      if (data.user.phone) {
        updateData.phone = data.user.phone;
      }
      if (data.user.profilePictureUrl) {
        updateData.profile_pic_url = data.user.profilePictureUrl;
      }
    }

    // Extrair informações alternativas se disponíveis
    if (data.profileName && !updateData.profile_name) {
      updateData.profile_name = data.profileName;
    }
    if (data.phone && !updateData.phone) {
      updateData.phone = data.phone;
    }

    const { error } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook FASE 3] ❌ Error updating ready status:', error);
    } else {
      console.log('[Webhook FASE 3] ✅ Instance ready status updated with user info');
    }
  } catch (error) {
    console.error('[Webhook FASE 3] ❌ Exception in handleReadyEvent:', error);
  }
}
