
import { VPS_CONFIG, corsHeaders, getVPSHeaders } from './config.ts';

// Função para fazer requisições VPS com retry
async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[VPS Request] Attempt ${i + 1}/${retries} to: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30 segundos timeout
      });
      
      console.log(`[VPS Response] Status: ${response.status} ${response.statusText}`);
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
  try {
    console.log(`[Status] Getting status for instance: ${instanceId}`);
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/status`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId })
    });

    if (response.ok) {
      const data = await response.json();
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: data.status,
          permanent_mode: data.permanent_mode || false,
          auto_reconnect: data.auto_reconnect || false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      throw new Error(`Status request failed: ${response.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('[Status] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function getQRCode(instanceId: string) {
  try {
    console.log(`[QR Code] Getting QR code for instance: ${instanceId}`);
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId })
    });

    if (response.ok) {
      const data = await response.json();
      return new Response(
        JSON.stringify({ 
          success: true, 
          qrCode: data.qrCode,
          permanent_mode: data.permanent_mode || false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      console.error(`[QR Code] VPS request failed: ${response.status} - ${errorText}`);
      throw new Error(`VPS QR request failed: ${response.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('[QR Code] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function checkServerHealth() {
  try {
    console.log('[Health] Checking WhatsApp Web.js server health...');
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: getVPSHeaders()
    }, 2);

    if (response.ok) {
      const data = await response.json();
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            status: data.status || 'online',
            server: data.server,
            version: data.version,
            permanent_mode: data.permanent_mode || false,
            health_check_enabled: data.health_check_enabled || false,
            auto_reconnect_enabled: data.auto_reconnect_enabled || false,
            active_instances: data.active_instances || 0,
            timestamp: data.timestamp || new Date().toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(`Server health check failed: ${response.status}`);
    }

  } catch (error) {
    console.error('[Health] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function getServerInfo() {
  try {
    console.log('[Server Info] Getting server information...');
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/status`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            ...data,
            permanent_mode: data.permanent_mode || false,
            auto_reconnect: data.auto_reconnect || false
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(`Server info request failed: ${response.status}`);
    }

  } catch (error) {
    console.error('[Server Info] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Função para sincronizar instâncias e limpar órfãs
export async function syncInstances(supabase: any, companyId: string) {
  try {
    console.log(`[Sync] Syncing instances for company: ${companyId}`);
    
    // Buscar instâncias do banco
    const { data: dbInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('company_id', companyId)
      .eq('connection_type', 'web');

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Buscar instâncias do VPS
    const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    let vpsInstances = [];
    if (vpsResponse.ok) {
      const vpsData = await vpsResponse.json();
      vpsInstances = vpsData.instances || [];
    }

    // Sincronizar status das instâncias
    const syncResults = [];
    
    for (const dbInstance of dbInstances || []) {
      const vpsInstance = vpsInstances.find(v => v.instanceId === dbInstance.vps_instance_id);
      
      if (vpsInstance) {
        // Atualizar status no banco se necessário
        const updates: any = {};
        
        if (vpsInstance.status !== dbInstance.connection_status) {
          updates.connection_status = vpsInstance.status;
        }
        
        if (vpsInstance.phone && vpsInstance.phone !== dbInstance.phone) {
          updates.phone = vpsInstance.phone;
        }
        
        if (Object.keys(updates).length > 0) {
          updates.updated_at = new Date().toISOString();
          
          await supabase
            .from('whatsapp_instances')
            .update(updates)
            .eq('id', dbInstance.id);
            
          syncResults.push({
            instanceId: dbInstance.id,
            action: 'updated',
            changes: updates
          });
        }
      } else {
        // Instância órfã no banco - marcar como desconectada
        await supabase
          .from('whatsapp_instances')
          .update({
            connection_status: 'disconnected',
            web_status: 'disconnected',
            updated_at: new Date().toISOString()
          })
          .eq('id', dbInstance.id);
          
        syncResults.push({
          instanceId: dbInstance.id,
          action: 'marked_disconnected',
          reason: 'not_found_in_vps'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: syncResults,
        total_synced: syncResults.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Sync] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
