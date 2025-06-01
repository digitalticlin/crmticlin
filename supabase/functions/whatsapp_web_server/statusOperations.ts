
import { VPS_CONFIG, corsHeaders } from './config.ts';

export async function getInstanceStatus(instanceId: string) {
  console.log('[StatusOperations] Getting status for instance:', instanceId);
  
  try {
    const response = await fetch(`${VPS_CONFIG.baseUrl}/status/${instanceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // Aumentado para 10s
    });

    console.log('[StatusOperations] VPS response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[StatusOperations] VPS error:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const status = await response.json();
    console.log('[StatusOperations] VPS status data:', JSON.stringify(status, null, 2));
    
    return new Response(
      JSON.stringify({ success: true, status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[StatusOperations] Status check failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Status check failed: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

export async function getQRCode(instanceId: string) {
  console.log('[StatusOperations] Getting QR code for instance:', instanceId);
  
  try {
    const response = await fetch(`${VPS_CONFIG.baseUrl}/qr/${instanceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    console.log('[StatusOperations] QR response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[StatusOperations] QR error:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('[StatusOperations] QR result available:', !!result.qrCode);
    
    return new Response(
      JSON.stringify({ success: true, qrCode: result.qrCode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[StatusOperations] QR code fetch failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `QR code fetch failed: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

export async function syncInstanceStatus(supabase: any, vpsInstanceId: string) {
  console.log('[StatusOperations] Syncing status for VPS instance:', vpsInstanceId);
  
  try {
    // Primeiro busca o status no VPS
    const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/status/${vpsInstanceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!vpsResponse.ok) {
      throw new Error(`VPS HTTP ${vpsResponse.status}`);
    }

    const vpsStatus = await vpsResponse.json();
    console.log('[StatusOperations] VPS status:', JSON.stringify(vpsStatus, null, 2));

    // Busca a instância no banco
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', vpsInstanceId)
      .single();

    if (fetchError) {
      console.error('[StatusOperations] Database fetch error:', fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    console.log('[StatusOperations] Current instance in DB:', instance);

    // Prepara dados para atualização
    const updateData: any = {};
    
    if (vpsStatus.connected && vpsStatus.phone && !instance.phone) {
      updateData.phone = vpsStatus.phone;
      updateData.web_status = 'ready';
      updateData.connection_status = 'open';
      updateData.date_connected = new Date().toISOString();
      updateData.qr_code = null; // Remove QR code quando conectado
      
      if (vpsStatus.profileName) updateData.profile_name = vpsStatus.profileName;
      if (vpsStatus.profilePicUrl) updateData.profile_pic_url = vpsStatus.profilePicUrl;
      
      console.log('[StatusOperations] Phone found, updating with:', updateData);
    } else if (!vpsStatus.connected) {
      updateData.web_status = 'disconnected';
      updateData.connection_status = 'disconnected';
      updateData.date_disconnected = new Date().toISOString();
      
      console.log('[StatusOperations] Not connected, updating status to disconnected');
    }

    // Atualiza no banco se houver mudanças
    if (Object.keys(updateData).length > 0) {
      const { data: updatedInstance, error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('vps_instance_id', vpsInstanceId)
        .select()
        .single();

      if (updateError) {
        console.error('[StatusOperations] Update error:', updateError);
        throw new Error(`Update failed: ${updateError.message}`);
      }

      console.log('[StatusOperations] Instance updated successfully:', updatedInstance);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated: true,
          instance: updatedInstance,
          vpsStatus
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('[StatusOperations] No updates needed');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated: false,
          instance,
          vpsStatus
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[StatusOperations] Sync failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Sync failed: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

export async function checkServerHealth() {
  console.log('[StatusOperations] Checking server health');
  
  try {
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    console.log('[StatusOperations] Health check status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const health = await response.json();
    console.log('[StatusOperations] Health data:', health);
    
    return new Response(
      JSON.stringify({ success: true, health }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[StatusOperations] Health check failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Health check failed: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
