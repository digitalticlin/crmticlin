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

  // Check for existing instances with same name
  const { data: existingInstance } = await supabase
    .from('whatsapp_instances')
    .select('id')
    .eq('company_id', profile.company_id)
    .eq('instance_name', instanceData.instanceName)
    .single();

  if (existingInstance) {
    // Delete existing instance if found
    await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', existingInstance.id);
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
    console.error('Database error:', dbError);
    throw new Error(`Erro no banco de dados: ${dbError.message}`);
  }

  // Send command to VPS to create WhatsApp instance
  try {
    console.log(`Sending create request to: ${VPS_CONFIG.baseUrl}/create`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceId: vpsInstanceId,
        sessionName: instanceData.instanceName,
        webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error('VPS HTTP error:', vpsResponse.status, errorText);
      throw new Error(`Servidor WhatsApp indisponível (${vpsResponse.status})`);
    }

    const vpsResult = await vpsResponse.json();
    
    if (!vpsResult.success) {
      console.error('VPS error result:', vpsResult);
      throw new Error(`Erro no servidor: ${vpsResult.error || 'Erro desconhecido'}`);
    }

    // Update database with QR code if available
    if (vpsResult.qrCode) {
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          qr_code: vpsResult.qrCode,
          web_status: 'waiting_scan'
        })
        .eq('id', dbInstance.id);

      if (updateError) {
        console.error('Error updating QR code:', updateError);
      }
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

    // Determine error message based on error type
    let errorMessage = 'Erro de comunicação com servidor WhatsApp';
    
    if (vpsError.name === 'AbortError') {
      errorMessage = 'Timeout: Servidor WhatsApp não respondeu em 30s';
    } else if (vpsError.message.includes('fetch')) {
      errorMessage = 'Servidor WhatsApp offline ou inacessível';
    } else {
      errorMessage = vpsError.message;
    }

    throw new Error(errorMessage);
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
