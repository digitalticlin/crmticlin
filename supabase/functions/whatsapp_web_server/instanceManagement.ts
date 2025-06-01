import { VPS_CONFIG, corsHeaders } from './config.ts';
import { InstanceData } from './types.ts';

export async function createWhatsAppInstance(supabase: any, instanceData: InstanceData, userId: string) {
  console.log('Creating WhatsApp Web.js instance:', instanceData);

  try {
    // Get user company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.company_id) {
      console.error('User company not found:', profileError);
      throw new Error('User company not found');
    }

    console.log('User company found:', profile.company_id);

    // Generate unique VPS instance ID
    const vpsInstanceId = `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Generated VPS instance ID:', vpsInstanceId);
    
    // Create instance record in database first
    const { data: dbInstance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: instanceData.instanceName,
        phone: '',
        company_id: profile.company_id,
        connection_type: 'web',
        server_url: VPS_CONFIG.baseUrl,
        vps_instance_id: vpsInstanceId,
        web_status: 'creating',
        connection_status: 'connecting'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('Database instance created:', dbInstance);

    // Prepare webhook URL
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`;
    console.log('Webhook URL:', webhookUrl);

    // Send command to VPS to create WhatsApp instance
    console.log(`Sending create request to: ${VPS_CONFIG.baseUrl}/create`);
    
    const vpsPayload = {
      instanceId: vpsInstanceId,
      sessionName: instanceData.instanceName,
      webhookUrl: webhookUrl
    };
    
    console.log('VPS payload:', JSON.stringify(vpsPayload, null, 2));

    const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(vpsPayload)
    });

    console.log('VPS response status:', vpsResponse.status);

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error('VPS HTTP error:', vpsResponse.status, errorText);
      
      // Update database to reflect error
      await supabase
        .from('whatsapp_instances')
        .update({
          web_status: 'error',
          connection_status: 'disconnected'
        })
        .eq('id', dbInstance.id);

      throw new Error(`VPS HTTP ${vpsResponse.status}: ${errorText}`);
    }

    const vpsResult = await vpsResponse.json();
    console.log('VPS result:', JSON.stringify(vpsResult, null, 2));
    
    if (!vpsResult.success) {
      console.error('VPS creation failed:', vpsResult.error);
      
      // Update database to reflect error
      await supabase
        .from('whatsapp_instances')
        .update({
          web_status: 'error',
          connection_status: 'disconnected'
        })
        .eq('id', dbInstance.id);

      throw new Error(`VPS error: ${vpsResult.error || 'Unknown error'}`);
    }

    // Update database with QR code if available
    let updatedInstance = dbInstance;
    if (vpsResult.qrCode) {
      console.log('Updating instance with QR code');
      const { data: qrUpdateResult, error: qrError } = await supabase
        .from('whatsapp_instances')
        .update({
          qr_code: vpsResult.qrCode,
          web_status: 'waiting_scan'
        })
        .eq('id', dbInstance.id)
        .select()
        .single();

      if (qrError) {
        console.error('Error updating QR code:', qrError);
      } else {
        updatedInstance = qrUpdateResult;
        console.log('QR code updated successfully');
      }
    }

    console.log('Instance creation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        instance: {
          ...updatedInstance,
          qr_code: vpsResult.qrCode || updatedInstance.qr_code
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (vpsError) {
    console.error('VPS communication error:', vpsError);
    throw new Error(`Failed to create instance: ${vpsError.message}`);
  }
}

export async function deleteWhatsAppInstance(supabase: any, instanceId: string) {
  console.log('Deleting WhatsApp Web.js instance:', instanceId);

  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('vps_instance_id')
    .eq('id', instanceId)
    .single();

  if (!instance?.vps_instance_id) {
    throw new Error('Instance not found');
  }

  // Send delete command to VPS
  try {
    const response = await fetch(`${VPS_CONFIG.baseUrl}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceId: instance.vps_instance_id
      })
    });

    if (!response.ok) {
      console.error(`VPS delete failed: HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting from VPS:', error);
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('whatsapp_instances')
    .delete()
    .eq('id', instanceId);

  if (deleteError) {
    throw new Error(`Database delete error: ${deleteError.message}`);
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
