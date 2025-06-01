
export async function handleMessageEvent(supabase: any, instanceId: string, data: any) {
  console.log('Handling message event for instance:', instanceId);
  
  try {
    // Get WhatsApp instance
    const { data: whatsappInstance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, company_id')
      .eq('vps_instance_id', instanceId)
      .single();

    if (instanceError || !whatsappInstance) {
      console.error('WhatsApp instance not found for VPS instance:', instanceId, instanceError);
      return;
    }

    // Extract phone number and clean it
    const phoneNumber = (data.from || '').replace(/\D/g, '');
    
    if (!phoneNumber) {
      console.error('No phone number found in message data');
      return;
    }

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
          unread_count: existingLead.unread_count + 1
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
        timestamp: new Date(data.timestamp * 1000).toISOString()
      });

    console.log('Message processed successfully');
  } catch (error) {
    console.error('Failed to handle message event:', error);
  }
}
