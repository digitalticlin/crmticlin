
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
      return response;
    } catch (error) {
      console.error(`VPS request error (attempt ${i + 1}):`, error);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
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

  // FASE 3: Test VPS connectivity
  try {
    console.log('Testing VPS connectivity...');
    const healthResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      }
    }, 2);

    if (!healthResponse.ok) {
      throw new Error(`VPS health check failed: ${healthResponse.status}`);
    }

    console.log('VPS is responsive, proceeding with instance creation...');
  } catch (healthError) {
    console.error('VPS health check failed:', healthError);
    throw new Error(`VPS não está respondendo: ${healthError.message}`);
  }

  // FASE 4: Try different methods to create instance on VPS
  let vpsResult;
  const createMethods = [
    {
      name: 'POST /create with instanceId',
      url: `${VPS_CONFIG.baseUrl}/create`,
      method: 'POST',
      body: {
        instanceId: vpsInstanceId,
        sessionName: instanceData.instanceName,
        webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`,
        companyId: profile.company_id
      }
    },
    {
      name: 'POST /create with instanceName',
      url: `${VPS_CONFIG.baseUrl}/create`,
      method: 'POST',
      body: {
        instanceName: instanceData.instanceName,
        sessionName: instanceData.instanceName,
        webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`,
        companyId: profile.company_id
      }
    },
    {
      name: 'POST /create basic',
      url: `${VPS_CONFIG.baseUrl}/create`,
      method: 'POST',
      body: {
        name: instanceData.instanceName,
        session: instanceData.instanceName
      }
    }
  ];

  for (const method of createMethods) {
    try {
      console.log(`Trying create method: ${method.name}`);
      console.log(`URL: ${method.url}`);
      console.log(`Body:`, method.body);
      
      const vpsResponse = await makeVPSRequest(method.url, {
        method: method.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        },
        body: JSON.stringify(method.body)
      }, 1); // Only 1 retry per method

      if (vpsResponse.ok) {
        vpsResult = await vpsResponse.json();
        console.log(`Success with method: ${method.name}`, vpsResult);
        break;
      } else {
        const errorText = await vpsResponse.text();
        console.log(`Method ${method.name} failed with status ${vpsResponse.status}: ${errorText}`);
      }
    } catch (methodError) {
      console.log(`Method ${method.name} failed:`, methodError.message);
      continue;
    }
  }

  if (!vpsResult || !vpsResult.success) {
    throw new Error(`Todos os métodos de criação falharam. Último erro: ${vpsResult?.error || 'VPS não respondeu corretamente'}`);
  }

  // FASE 5: Create database record AFTER VPS confirms success
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
        qr_code: vpsResult.qrCode || vpsResult.qr || null
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

    return new Response(
      JSON.stringify({
        success: true,
        instance: {
          ...dbInstance,
          qr_code: vpsResult.qrCode || vpsResult.qr || null
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
    .select('vps_instance_id, instance_name')
    .eq('id', instanceId)
    .single();

  if (!instance?.vps_instance_id) {
    console.log('No VPS instance ID found, only deleting from database');
  } else {
    // Try different delete methods
    const deleteMethods = [
      {
        name: 'POST /delete with instanceId',
        url: `${VPS_CONFIG.baseUrl}/delete`,
        method: 'POST',
        body: { instanceId: instance.vps_instance_id }
      },
      {
        name: 'DELETE /delete with instanceId',
        url: `${VPS_CONFIG.baseUrl}/delete`,
        method: 'DELETE',
        body: { instanceId: instance.vps_instance_id }
      },
      {
        name: 'POST /delete with instanceName',
        url: `${VPS_CONFIG.baseUrl}/delete`,
        method: 'POST',
        body: { instanceName: instance.instance_name }
      }
    ];

    for (const method of deleteMethods) {
      try {
        console.log(`Trying delete method: ${method.name}`);
        
        await makeVPSRequest(method.url, {
          method: method.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPS_CONFIG.authToken}`
          },
          body: JSON.stringify(method.body)
        }, 1);
        
        console.log(`Success with delete method: ${method.name}`);
        break;
      } catch (methodError) {
        console.log(`Delete method ${method.name} failed:`, methodError.message);
        continue;
      }
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
