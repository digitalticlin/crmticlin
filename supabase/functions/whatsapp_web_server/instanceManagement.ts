
import { VPS_CONFIG, corsHeaders } from './config.ts';
import { InstanceData } from './types.ts';

async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`VPS Request attempt ${i + 1}/${retries} to: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      console.log(`VPS Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`VPS HTTP ${response.status}: ${errorText}`);
        
        if (i === retries - 1) {
          throw new Error(`VPS HTTP ${response.status}: ${errorText}`);
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      
      return response;
    } catch (error) {
      console.error(`VPS request error (attempt ${i + 1}):`, error);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw new Error('Max retries exceeded');
}

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
    throw new Error(`Database error: ${dbError.message}`);
  }

  // Test VPS connectivity first
  try {
    console.log('Testing VPS connectivity...');
    const healthResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      }
    }, 1);

    if (!healthResponse.ok) {
      throw new Error(`VPS health check failed: ${healthResponse.status}`);
    }

    console.log('VPS is responsive, proceeding with instance creation...');
  } catch (healthError) {
    console.error('VPS health check failed:', healthError);
    
    // Update database to reflect VPS connection error
    await supabase
      .from('whatsapp_instances')
      .update({
        web_status: 'vps_error',
        connection_status: 'disconnected'
      })
      .eq('id', dbInstance.id);

    throw new Error(`VPS não está respondendo: ${healthError.message}`);
  }

  // Send command to VPS to create WhatsApp instance
  try {
    console.log(`Sending create request to: ${VPS_CONFIG.baseUrl}/instance/create`);
    
    const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      body: JSON.stringify({
        instanceId: vpsInstanceId,
        sessionName: instanceData.instanceName,
        webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`,
        companyId: profile.company_id
      })
    });

    const vpsResult = await vpsResponse.json();
    console.log('VPS create response:', vpsResult);
    
    if (!vpsResult.success) {
      throw new Error(`VPS error: ${vpsResult.error || 'Unknown error'}`);
    }

    // Update database with success status and QR code if available
    const updateData: any = {
      web_status: vpsResult.qrCode ? 'waiting_scan' : 'created',
      connection_status: 'connecting'
    };

    if (vpsResult.qrCode) {
      updateData.qr_code = vpsResult.qrCode;
    }

    await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', dbInstance.id);

    return new Response(
      JSON.stringify({
        success: true,
        instance: {
          ...dbInstance,
          qr_code: vpsResult.qrCode,
          web_status: updateData.web_status
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (vpsError) {
    console.error('VPS communication error:', vpsError);
    
    // Update database to reflect VPS error with more specific status
    await supabase
      .from('whatsapp_instances')
      .update({
        web_status: 'vps_create_error',
        connection_status: 'disconnected'
      })
      .eq('id', dbInstance.id);

    throw new Error(`Falha ao criar instância na VPS: ${vpsError.message}`);
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

  // Send delete command to VPS with retry logic
  try {
    await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      body: JSON.stringify({
        instanceId: instance.vps_instance_id
      })
    });
  } catch (error) {
    console.error('Error deleting from VPS (continuing with DB cleanup):', error);
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
