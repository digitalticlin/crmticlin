
// FASE 1 & 2: Handlers otimizados para eventos de conexão com logs detalhados
export async function handleQREvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook FASE 1] 📱 QR Code event for instance:', instanceId);
  console.log('[Webhook FASE 1] 📋 QR Data received:', JSON.stringify(data, null, 2));
  
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
      console.error('[Webhook FASE 1] ❌ Error updating QR:', error);
    } else {
      console.log('[Webhook FASE 1] ✅ QR Code updated successfully');
    }
  } catch (error) {
    console.error('[Webhook FASE 1] ❌ Exception in handleQREvent:', error);
  }
}

export async function handleAuthenticatedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook FASE 1] 🔐 Authenticated event for instance:', instanceId);
  console.log('[Webhook FASE 1] 📋 Auth Data received:', JSON.stringify(data, null, 2));
  
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
      console.error('[Webhook FASE 1] ❌ Error updating authentication status:', error);
    } else {
      console.log('[Webhook FASE 1] ✅ Authentication status updated');
    }
  } catch (error) {
    console.error('[Webhook FASE 1] ❌ Exception in handleAuthenticatedEvent:', error);
  }
}

export async function handleReadyEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook FASE 1] ✅ Ready event for instance:', instanceId, 'Data:', data);
  console.log('[Webhook FASE 1] 📊 CRITICAL: Processing ready event with full data:', JSON.stringify(data, null, 2));
  
  try {
    const updateData: any = {
      connection_status: 'ready',
      web_status: 'ready',
      date_connected: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // FASE 1: Extrair informações do usuário se disponíveis
    if (data.user) {
      console.log('[Webhook FASE 1] 👤 User data found in ready event:', data.user);
      if (data.user.id) {
        updateData.owner_jid = data.user.id;
        console.log('[Webhook FASE 1] 📱 Owner JID:', data.user.id);
      }
      if (data.user.name) {
        updateData.profile_name = data.user.name;
        console.log('[Webhook FASE 1] 👤 Profile name:', data.user.name);
      }
      if (data.user.phone) {
        updateData.phone = data.user.phone;
        console.log('[Webhook FASE 1] 📞 Phone number:', data.user.phone);
      }
      if (data.user.profilePictureUrl) {
        updateData.profile_pic_url = data.user.profilePictureUrl;
      }
    }

    // FASE 1: Extrair informações alternativas se disponíveis
    if (data.profileName && !updateData.profile_name) {
      updateData.profile_name = data.profileName;
      console.log('[Webhook FASE 1] 👤 Alternative profile name:', data.profileName);
    }
    if (data.phone && !updateData.phone) {
      updateData.phone = data.phone;
      console.log('[Webhook FASE 1] 📞 Alternative phone:', data.phone);
    }

    console.log('[Webhook FASE 1] 💾 Final update data:', JSON.stringify(updateData, null, 2));

    const { error } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook FASE 1] ❌ Error updating ready status:', error);
    } else {
      console.log('[Webhook FASE 1] ✅ Instance ready status updated with user info');
      console.log('[Webhook FASE 1] 🎯 SUCCESS: Instance', instanceId, 'is now READY with phone:', updateData.phone);
    }
  } catch (error) {
    console.error('[Webhook FASE 1] ❌ Exception in handleReadyEvent:', error);
  }
}
