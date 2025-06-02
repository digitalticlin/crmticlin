
import { VPS_CONFIG, corsHeaders, getVPSHeaders, isRealQRCode } from './config.ts';

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

export async function getInstanceStatus(instanceId: string) {
  console.log(`[Status] Getting status for instance: ${instanceId}`);

  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/status`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VPS status request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[Status] Result:`, result);

    return new Response(
      JSON.stringify({
        success: true,
        status: result.status
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Status] Error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function getQRCode(instanceId: string) {
  console.log(`[QR Code] Getting QR code for instance: ${instanceId}`);

  try {
    console.log(`[VPS Request] Attempting connection to: ${VPS_CONFIG.baseUrl}/instance/qr`);
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[QR Code] VPS request failed: ${response.status} - ${errorText}`);
      throw new Error(`VPS QR request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[QR Code] Result:`, result);

    // Validate if QR code is real
    if (result.success && result.qrCode) {
      const qrIsReal = isRealQRCode(result.qrCode);
      console.log(`[QR Code] QR Code validation - Is Real: ${qrIsReal}`);
      
      if (!qrIsReal) {
        console.warn(`[QR Code] VPS returned fake/placeholder QR code`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'VPS retornou QR Code falso. Aguarde a inicialização do WhatsApp Web.js ou tente novamente.',
            qrCode: null
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        qrCode: result.qrCode || null,
        error: result.error
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[QR Code] Error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro ao obter QR Code: ${error.message}`,
        qrCode: null
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function checkServerHealth() {
  console.log(`[Health] Checking server health`);

  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: getVPSHeaders()
    }, 2);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[Health] Server health check result:`, result);

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Health] Error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Servidor VPS offline: ${error.message}`
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function getServerInfo() {
  console.log(`[Server Info] Getting server information`);

  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/status`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (!response.ok) {
      throw new Error(`Server info request failed: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[Server Info] Result:`, result);

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Server Info] Error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function syncInstances(supabase: any, companyId: string) {
  console.log(`[Sync] Syncing instances for company: ${companyId}`);

  try {
    // Get active instances from VPS
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (!response.ok) {
      throw new Error(`Sync request failed: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[Sync] VPS instances:`, result);

    // Get database instances for company
    const { data: dbInstances, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('company_id', companyId)
      .eq('connection_type', 'web');

    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }

    console.log(`[Sync] Database instances:`, dbInstances);

    // Update database instances with VPS status
    let updatedCount = 0;
    for (const dbInstance of dbInstances || []) {
      const vpsInstance = result.instances?.find((vps: any) => 
        vps.instanceId === dbInstance.vps_instance_id
      );

      if (vpsInstance) {
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({
            connection_status: vpsInstance.isReady ? 'connected' : 'disconnected',
            web_status: vpsInstance.status || 'unknown',
            phone: vpsInstance.phone || dbInstance.phone,
            updated_at: new Date().toISOString()
          })
          .eq('id', dbInstance.id);

        if (!updateError) {
          updatedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronizadas ${updatedCount} instâncias`,
        data: { updatedCount, totalVPS: result.instances?.length || 0 }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Sync] Error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
