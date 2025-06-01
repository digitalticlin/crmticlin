
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

    // Normalizar valores para comparação
    const vpsConnected = vpsStatus.connected === true;
    const vpsPhone = vpsStatus.phone || '';
    const vpsName = vpsStatus.name || vpsStatus.profileName || '';
    
    const dbConnected = ['ready', 'open'].includes(instance.connection_status) || ['ready', 'open'].includes(instance.web_status);
    const dbPhone = instance.phone || '';
    
    console.log('[StatusOperations] Status comparison:', {
      vpsConnected,
      vpsPhone,
      vpsName,
      dbConnected,
      dbPhone,
      connectionStatusDB: instance.connection_status,
      webStatusDB: instance.web_status
    });

    // Prepara dados para atualização
    const updateData: any = {};
    let needsUpdate = false;

    // Verifica se precisa atualizar baseado no status de conexão
    if (vpsConnected && !dbConnected) {
      // VPS conectado mas DB mostra desconectado - sempre atualizar
      updateData.web_status = 'ready';
      updateData.connection_status = 'open';
      updateData.date_connected = new Date().toISOString();
      updateData.qr_code = null; // Remove QR code quando conectado
      needsUpdate = true;
      
      console.log('[StatusOperations] VPS connected but DB disconnected - updating to connected');
    } else if (!vpsConnected && dbConnected) {
      // VPS desconectado mas DB mostra conectado - atualizar para desconectado
      updateData.web_status = 'disconnected';
      updateData.connection_status = 'disconnected';
      updateData.date_disconnected = new Date().toISOString();
      needsUpdate = true;
      
      console.log('[StatusOperations] VPS disconnected but DB connected - updating to disconnected');
    }

    // Atualizar telefone se VPS está conectado e tem telefone diferente
    if (vpsConnected && vpsPhone && vpsPhone !== dbPhone) {
      updateData.phone = vpsPhone;
      needsUpdate = true;
      
      console.log('[StatusOperations] Phone number different, updating:', { vpsPhone, dbPhone });
    }

    // Atualizar nome do perfil se disponível
    if (vpsConnected && vpsName && vpsName !== instance.profile_name) {
      updateData.profile_name = vpsName;
      needsUpdate = true;
      
      console.log('[StatusOperations] Profile name different, updating:', { vpsName, dbName: instance.profile_name });
    }

    // Atualizar URL da foto do perfil se disponível
    if (vpsConnected && vpsStatus.profilePicUrl && vpsStatus.profilePicUrl !== instance.profile_pic_url) {
      updateData.profile_pic_url = vpsStatus.profilePicUrl;
      needsUpdate = true;
    }

    console.log('[StatusOperations] Update needed:', needsUpdate, 'Update data:', updateData);

    // Atualiza no banco se houver mudanças
    if (needsUpdate) {
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
          vpsStatus,
          changes: updateData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('[StatusOperations] No updates needed - statuses are in sync');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated: false,
          instance,
          vpsStatus,
          reason: 'Statuses already in sync'
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
