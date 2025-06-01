
export async function handleReadyEvent(supabase: any, instanceId: string, data: any) {
  console.log('✅ CRITICAL: Handling ready event for instance:', instanceId);
  console.log('✅ CRITICAL: Ready data received:', JSON.stringify(data, null, 2));
  
  try {
    // First, check if instance exists
    const { data: existingInstance, error: checkError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', instanceId)
      .single();

    if (checkError) {
      console.error('❌ CRITICAL: Error checking existing instance:', checkError);
      throw new Error(`Instance not found: ${instanceId}`);
    }

    console.log('✅ CRITICAL: Existing instance found:', existingInstance?.id, 'Current status:', existingInstance?.web_status);

    // Extract phone number and clean it
    const phone = data.phone || data.phoneNumber || data.id || '';
    const profileName = data.name || data.profileName || data.pushname || '';
    const profilePicUrl = data.profilePic || data.profilePicUrl || '';

    console.log('✅ CRITICAL: Extracted connection data:', { phone, profileName, profilePicUrl });

    // CRITICAL UPDATE: Force ready status
    const { data: updateResult, error } = await supabase
      .from('whatsapp_instances')
      .update({
        web_status: 'ready',
        connection_status: 'open',
        phone: phone,
        profile_name: profileName,
        profile_pic_url: profilePicUrl,
        date_connected: new Date().toISOString(),
        qr_code: null, // Clear QR code when connected
        session_data: data
      })
      .eq('vps_instance_id', instanceId)
      .select();

    if (error) {
      console.error('❌ CRITICAL: Error updating ready status:', error);
      throw error;
    }

    console.log('✅ CRITICAL: Instance status SUCCESSFULLY updated to READY:', updateResult);
    
    // Additional verification
    if (updateResult && updateResult.length > 0) {
      console.log('✅ CRITICAL: Verified instance is now CONNECTED:', {
        id: updateResult[0].id,
        web_status: updateResult[0].web_status,
        phone: updateResult[0].phone,
        profile_name: updateResult[0].profile_name
      });
    }

  } catch (error) {
    console.error('❌ CRITICAL: Failed to handle ready event:', error);
    throw error;
  }
}
