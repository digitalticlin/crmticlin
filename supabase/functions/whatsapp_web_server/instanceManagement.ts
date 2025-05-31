
import { VPS_CONFIG, corsHeaders } from './config.ts';
import { InstanceData } from './types.ts';

export async function createWhatsAppInstance(supabase: any, instanceData: InstanceData, userId: string) {
  console.log('Creating WhatsApp Web.js instance:', instanceData);

  // Get user company
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .single();

  if (!profile?.company_id) {
    throw new Error('User company not found');
  }

  // Generate unique VPS instance ID
  const vpsInstanceId = `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create instance record in database
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
    throw new Error(`Database error: ${dbError.message}`);
  }

  // Send command to VPS to create WhatsApp instance
  try {
    console.log(`Sending create request to: ${VPS_CONFIG.baseUrl}/create`);
    
    const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceId: vpsInstanceId,
        sessionName: instanceData.instanceName,
        webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`
      })
    });

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      throw new Error(`VPS HTTP ${vpsResponse.status}: ${errorText}`);
    }

    const vpsResult = await vpsResponse.json();
    
    if (!vpsResult.success) {
      throw new Error(`VPS error: ${vpsResult.error || 'Unknown error'}`);
    }

    // Update database with QR code if available
    if (vpsResult.qrCode) {
      await supabase
        .from('whatsapp_instances')
        .update({
          qr_code: vpsResult.qrCode,
          web_status: 'waiting_scan'
        })
        .eq('id', dbInstance.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        instance: {
          ...dbInstance,
          qr_code: vpsResult.qrCode
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (vpsError) {
    console.error('VPS communication error:', vpsError);
    
    // Update database to reflect error
    await supabase
      .from('whatsapp_instances')
      .update({
        web_status: 'error',
        connection_status: 'disconnected'
      })
      .eq('id', dbInstance.id);

    throw new Error(`Failed to create instance on VPS: ${vpsError.message}`);
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
