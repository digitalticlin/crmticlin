
export async function handleQREvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 📱 Handling QR event for instance:', instanceId);
  
  try {
    // Primeiro verificar se a instância existe
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('vps_instance_id', instanceId)
      .single();

    if (!existingInstance) {
      console.log('[Webhook] ⚠️ Instance not found for QR event, will be handled by sync');
      return;
    }

    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: data.qr,
        web_status: 'waiting_scan',
        connection_status: 'connecting',
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook] ❌ Error updating QR code:', error);
    } else {
      console.log('[Webhook] ✅ QR code updated successfully for:', instanceId);
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleQREvent:', error);
  }
}

export async function handleAuthenticatedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 🔐 Handling authenticated event for instance:', instanceId);
  
  try {
    // Verificar se a instância existe
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('vps_instance_id', instanceId)
      .single();

    if (!existingInstance) {
      console.log('[Webhook] ⚠️ Instance not found for authenticated event, will be handled by sync');
      return;
    }

    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        web_status: 'authenticated',
        connection_status: 'authenticated',
        qr_code: null,
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook] ❌ Error updating authenticated status:', error);
    } else {
      console.log('[Webhook] ✅ Authenticated status updated successfully for:', instanceId);
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleAuthenticatedEvent:', error);
  }
}

export async function handleReadyEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 🚀 Handling ready event for instance:', instanceId, 'with data:', data);
  
  try {
    // LOGGING DETALHADO PARA DEBUGGING
    console.log('[Webhook] 📊 Instance data received:', {
      instanceId,
      phone: data.phone,
      name: data.name,
      profilePic: data.profilePic
    });

    // Verificar se a instância existe no banco
    const { data: existingInstance, error: checkError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', instanceId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[Webhook] ❌ Error checking instance:', checkError);
      return;
    }

    if (!existingInstance) {
      console.log('[Webhook] ⚠️ Instance not found in database for ready event, will be handled by sync process');
      return;
    }

    // ATUALIZAÇÃO CRÍTICA COM INFORMAÇÕES COMPLETAS
    const updateData: any = {
      web_status: 'ready',
      connection_status: 'open',
      date_connected: new Date().toISOString(),
      qr_code: null,
      updated_at: new Date().toISOString()
    };

    // Adicionar dados do telefone se disponíveis
    if (data.phone) {
      updateData.phone = data.phone;
      console.log('[Webhook] 📱 Phone number to update:', data.phone);
    }

    if (data.name) {
      updateData.profile_name = data.name;
      console.log('[Webhook] 👤 Profile name to update:', data.name);
    }

    if (data.profilePic) {
      updateData.profile_pic_url = data.profilePic;
      console.log('[Webhook] 🖼️ Profile pic to update:', data.profilePic);
    }

    console.log('[Webhook] 💾 Updating database with data:', updateData);

    const { data: updatedInstance, error } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('vps_instance_id', instanceId)
      .select()
      .single();

    if (error) {
      console.error('[Webhook] ❌ Error updating ready status:', error);
    } else {
      console.log('[Webhook] ✅ ✅ ✅ Instance ready and CONNECTED successfully!');
      console.log('[Webhook] 📊 Updated instance data:', updatedInstance);
      console.log('[Webhook] 🎉 INSTÂNCIA CONECTADA COM SUCESSO:', {
        id: updatedInstance?.id,
        instance_name: updatedInstance?.instance_name,
        phone: updatedInstance?.phone,
        status: updatedInstance?.connection_status
      });
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleReadyEvent:', error);
  }
}
