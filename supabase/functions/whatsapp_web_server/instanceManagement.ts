
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
  
  // FASE 1: Check for orphaned instances and clean them up
  console.log('Checking for orphaned instances...');
  const { data: orphanedInstances } = await supabase
    .from('whatsapp_instances')
    .select('id, instance_name, vps_instance_id')
    .eq('company_id', profile.company_id)
    .eq('instance_name', instanceData.instanceName);

  if (orphanedInstances && orphanedInstances.length > 0) {
    console.log(`Found ${orphanedInstances.length} potential orphaned instances with same name`);
    
    // Delete orphaned instances (those without proper VPS connection)
    for (const orphan of orphanedInstances) {
      if (!orphan.vps_instance_id || orphan.vps_instance_id === '') {
        console.log(`Cleaning up orphaned instance: ${orphan.id}`);
        await supabase
          .from('whatsapp_instances')
          .delete()
          .eq('id', orphan.id);
      }
    }
  }

  // FASE 2: Validate instance name uniqueness before proceeding
  const { data: existingInstance } = await supabase
    .from('whatsapp_instances')
    .select('id')
    .eq('company_id', profile.company_id)
    .eq('instance_name', instanceData.instanceName)
    .maybeSingle();

  if (existingInstance) {
    throw new Error(`Instância com nome "${instanceData.instanceName}" já existe. Tente com outro nome.`);
  }

  // FASE 3: Test VPS connectivity and verify correct endpoint
  try {
    console.log('Testing VPS connectivity...');
    const healthResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      }
    }, 2); // Only 2 retries for health check

    if (!healthResponse.ok) {
      throw new Error(`VPS health check failed: ${healthResponse.status}`);
    }

    console.log('VPS is responsive, proceeding with instance creation...');
  } catch (healthError) {
    console.error('VPS health check failed:', healthError);
    throw new Error(`VPS não está respondendo: ${healthError.message}`);
  }

  // FASE 4: Create instance on VPS FIRST (before database)
  let vpsResult;
  try {
    console.log(`Sending create request to VPS: ${VPS_CONFIG.baseUrl}/create`);
    
    const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/create`, {
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

    vpsResult = await vpsResponse.json();
    console.log('VPS create response:', vpsResult);
    
    if (!vpsResult.success) {
      throw new Error(`VPS error: ${vpsResult.error || 'Unknown VPS error'}`);
    }

  } catch (vpsError) {
    console.error('VPS communication error:', vpsError);
    
    // FASE 5: Improved error handling with specific messages
    if (vpsError.message.includes('404')) {
      throw new Error('Endpoint da VPS não encontrado. Verifique a configuração do servidor.');
    } else if (vpsError.message.includes('timeout')) {
      throw new Error('Timeout na conexão com a VPS. Tente novamente em alguns minutos.');
    } else {
      throw new Error(`Falha ao criar instância na VPS: ${vpsError.message}`);
    }
  }

  // FASE 2: Only create database record AFTER VPS confirms success
  try {
    console.log('VPS instance created successfully, now saving to database...');
    
    const { data: dbInstance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: instanceData.instanceName,
        phone: '', // Will be updated when connected
        company_id: profile.company_id,
        connection_type: 'web',
        server_url: VPS_CONFIG.baseUrl,
        vps_instance_id: vpsInstanceId,
        web_status: vpsResult.qrCode ? 'waiting_scan' : 'created',
        connection_status: 'connecting',
        qr_code: vpsResult.qrCode || null
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error after VPS success:', dbError);
      
      // If database fails, try to cleanup VPS instance
      try {
        await makeVPSRequest(`${VPS_CONFIG.baseUrl}/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPS_CONFIG.authToken}`
          },
          body: JSON.stringify({ instanceId: vpsInstanceId })
        });
      } catch (cleanupError) {
        console.error('Failed to cleanup VPS instance after DB error:', cleanupError);
      }
      
      throw new Error(`Erro no banco de dados: ${dbError.message}`);
    }

    console.log('Instance successfully created in database with ID:', dbInstance.id);

    // Log QR code status
    if (vpsResult.qrCode) {
      console.log('QR Code received and saved to database');
    } else {
      console.log('No QR Code received from VPS - may need to generate later');
    }

    return new Response(
      JSON.stringify({
        success: true,
        instance: {
          ...dbInstance,
          qr_code: vpsResult.qrCode || null
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error during database operation:', error);
    throw error;
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
    console.log('No VPS instance ID found, only deleting from database');
  } else {
    // Send delete command to VPS with retry logic
    try {
      await makeVPSRequest(`${VPS_CONFIG.baseUrl}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        },
        body: JSON.stringify({
          instanceId: instance.vps_instance_id
        })
      });
      console.log('Instance successfully deleted from VPS');
    } catch (error) {
      console.error('Error deleting from VPS (continuing with DB cleanup):', error);
    }
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('whatsapp_instances')
    .delete()
    .eq('id', instanceId);

  if (deleteError) {
    throw new Error(`Database delete error: ${deleteError.message}`);
  }

  console.log('Instance successfully deleted from database');

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
