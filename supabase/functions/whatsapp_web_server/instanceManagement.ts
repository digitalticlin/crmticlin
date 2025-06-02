
import { VPS_CONFIG, corsHeaders, getVPSHeaders, isRealQRCode } from './config.ts';
import { InstanceData } from './types.ts';

async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[VPS Request] Attempt ${i + 1}/${retries} to: ${url}`);
      console.log(`[VPS Request] Headers:`, options.headers);
      console.log(`[VPS Request] Body:`, options.body);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      console.log(`[VPS Response] Status: ${response.status} ${response.statusText}`);
      console.log(`[VPS Response] Headers:`, Object.fromEntries(response.headers.entries()));
      
      return response;
    } catch (error) {
      console.error(`[VPS Request] Error (attempt ${i + 1}):`, error);
      
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
  console.log('[Instance Management] Creating WhatsApp Web.js instance:', instanceData);

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
  console.log('[Instance Management] Checking for orphaned instances...');
  const { data: orphanedInstances } = await supabase
    .from('whatsapp_instances')
    .select('id, instance_name, vps_instance_id')
    .eq('company_id', profile.company_id)
    .eq('instance_name', instanceData.instanceName);

  if (orphanedInstances && orphanedInstances.length > 0) {
    console.log(`[Instance Management] Found ${orphanedInstances.length} potential orphaned instances with same name`);
    
    // Delete orphaned instances (those without proper VPS connection)
    for (const orphan of orphanedInstances) {
      if (!orphan.vps_instance_id || orphan.vps_instance_id === '') {
        console.log(`[Instance Management] Cleaning up orphaned instance: ${orphan.id}`);
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
    console.log('[Instance Management] Testing VPS connectivity...');
    const healthResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: getVPSHeaders()
    }, 2);

    if (!healthResponse.ok) {
      throw new Error(`VPS health check failed: ${healthResponse.status}`);
    }

    const healthData = await healthResponse.json();
    console.log('[Instance Management] VPS health check passed:', healthData);
  } catch (healthError) {
    console.error('[Instance Management] VPS health check failed:', healthError);
    throw new Error(`VPS não está respondendo: ${healthError.message}`);
  }

  // FASE 4: Create instance using CORRECT endpoint and payload format
  let vpsResult;
  try {
    console.log('[Instance Management] Creating instance with corrected authentication');
    
    // Payload structure with corrected authentication
    const payload = {
      instanceId: vpsInstanceId,
      sessionName: instanceData.instanceName,
      webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`,
      companyId: profile.company_id
    };
    
    console.log('[Instance Management] Using payload:', payload);
    console.log('[Instance Management] Using URL:', `${VPS_CONFIG.baseUrl}/instance/create`);
    console.log('[Instance Management] Using Headers:', getVPSHeaders());
    
    const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/create`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify(payload)
    });

    if (vpsResponse.ok) {
      vpsResult = await vpsResponse.json();
      console.log('[Instance Management] VPS creation SUCCESS:', vpsResult);
      
      // Validate if QR code returned is real
      if (vpsResult.qrCode) {
        const qrIsReal = isRealQRCode(vpsResult.qrCode);
        console.log(`[Instance Management] QR Code validation - Is Real: ${qrIsReal}`);
        
        if (!qrIsReal) {
          console.warn('[Instance Management] VPS returned fake QR code, but instance was created');
          // Don't fail the creation, just clear the fake QR
          vpsResult.qrCode = null;
          vpsResult.status = 'creating';
        }
      }
    } else {
      const errorText = await vpsResponse.text();
      console.error(`[Instance Management] VPS creation failed with status ${vpsResponse.status}: ${errorText}`);
      throw new Error(`VPS creation failed: ${vpsResponse.status} - ${errorText}`);
    }
  } catch (vpsError) {
    console.error('[Instance Management] VPS creation error:', vpsError);
    throw new Error(`Erro na criação VPS: ${vpsError.message}`);
  }

  if (!vpsResult || !vpsResult.success) {
    throw new Error(`Criação falhou. Erro VPS: ${vpsResult?.error || 'VPS não respondeu corretamente'}`);
  }

  // FASE 5: Create database record AFTER VPS confirms success
  try {
    console.log('[Instance Management] VPS instance created successfully, now saving to database...');
    
    const { data: dbInstance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: instanceData.instanceName,
        phone: '', // Will be updated when connected
        company_id: profile.company_id,
        connection_type: 'web',
        server_url: VPS_CONFIG.baseUrl,
        vps_instance_id: vpsInstanceId,
        web_status: vpsResult.qrCode ? 'waiting_scan' : 'creating',
        connection_status: 'connecting',
        qr_code: vpsResult.qrCode || null
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Instance Management] Database error after VPS success:', dbError);
      
      // If database fails, try to cleanup VPS instance
      try {
        await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/delete`, {
          method: 'POST',
          headers: getVPSHeaders(),
          body: JSON.stringify({ instanceId: vpsInstanceId })
        });
      } catch (cleanupError) {
        console.error('[Instance Management] Failed to cleanup VPS instance after DB error:', cleanupError);
      }
      
      throw new Error(`Erro no banco de dados: ${dbError.message}`);
    }

    console.log('[Instance Management] Instance successfully created in database with ID:', dbInstance.id);

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
    console.error('[Instance Management] Unexpected error during database operation:', error);
    throw error;
  }
}

export async function deleteWhatsAppInstance(supabase: any, instanceId: string) {
  console.log('[Instance Management] Deleting WhatsApp Web.js instance:', instanceId);

  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('vps_instance_id, instance_name')
    .eq('id', instanceId)
    .single();

  if (!instance?.vps_instance_id) {
    console.log('[Instance Management] No VPS instance ID found, only deleting from database');
  } else {
    // Use CORRECT delete endpoint with proper headers
    try {
      console.log('[Instance Management] Deleting from VPS with corrected authentication');
      
      await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/delete`, {
        method: 'POST',
        headers: getVPSHeaders(),
        body: JSON.stringify({ 
          instanceId: instance.vps_instance_id,
          instanceName: instance.instance_name 
        })
      });
      
      console.log('[Instance Management] Successfully deleted from VPS');
    } catch (deleteError) {
      console.error('[Instance Management] VPS delete error:', deleteError);
      // Continue with database deletion even if VPS delete fails
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

  console.log('[Instance Management] Instance successfully deleted from database');

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
