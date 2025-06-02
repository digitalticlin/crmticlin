
export async function handleMessageEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 💬 Handling message event for instance:', instanceId);
  
  try {
    // Get WhatsApp instance
    const { data: whatsappInstance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, company_id')
      .eq('vps_instance_id', instanceId)
      .single();

    if (instanceError || !whatsappInstance) {
      console.error('[Webhook] ❌ WhatsApp instance not found for VPS instance:', instanceId, instanceError);
      return;
    }

    // Extract phone number and clean it
    const phoneNumber = data.from.replace(/\D/g, '');
    
    // Find or create lead
    let lead;
    const { data: existingLead } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', phoneNumber)
      .eq('whatsapp_number_id', whatsappInstance.id)
      .single();

    if (existingLead) {
      lead = existingLead;
      
      // Update lead with new message info
      await supabase
        .from('leads')
        .update({
          last_message: data.body || '[Mídia]',
          last_message_time: new Date().toISOString(),
          unread_count: existingLead.unread_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);
    } else {
      // Create new lead
      const { data: newLead } = await supabase
        .from('leads')
        .insert({
          phone: phoneNumber,
          name: data.notifyName || data.from,
          whatsapp_number_id: whatsappInstance.id,
          company_id: whatsappInstance.company_id,
          last_message: data.body || '[Mídia]',
          last_message_time: new Date().toISOString(),
          unread_count: 1
        })
        .select()
        .single();
      
      lead = newLead;
    }

    if (lead) {
      // Save message
      await supabase
        .from('messages')
        .insert({
          lead_id: lead.id,
          whatsapp_number_id: whatsappInstance.id,
          text: data.body || '',
          from_me: false,
          external_id: data.id,
          media_type: data.type || 'text',
          media_url: data.mediaUrl || null,
          timestamp: data.timestamp ? new Date(data.timestamp * 1000).toISOString() : new Date().toISOString()
        });

      console.log('[Webhook] ✅ Message processed successfully for lead:', lead.id);
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleMessageEvent:', error);
  }
}
