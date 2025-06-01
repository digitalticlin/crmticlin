
import { VPS_CONFIG, corsHeaders } from './config.ts';

export async function getInstanceStatus(instanceId: string) {
  console.log('[StatusOperations] Getting status for instance:', instanceId);
  
  try {
    const response = await fetch(`${VPS_CONFIG.baseUrl}/status/${instanceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
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

export async function syncInstanceStatus(supabase: any, vpsInstanceId: string, forceUpdate: boolean = false) {
  console.log('[StatusOperations] Syncing status for VPS instance:', vpsInstanceId, 'Force update:', forceUpdate);
  
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
      const errorText = await vpsResponse.text();
      console.error('[StatusOperations] VPS HTTP Error:', vpsResponse.status, errorText);
      throw new Error(`VPS HTTP ${vpsResponse.status}: ${errorText}`);
    }

    const vpsStatus = await vpsResponse.json();
    console.log('[StatusOperations] VPS status response:', JSON.stringify(vpsStatus, null, 2));

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

    console.log('[StatusOperations] Current instance in DB:', JSON.stringify(instance, null, 2));

    // Extrair valores do VPS - múltiplos formatos possíveis
    const vpsConnected = vpsStatus.connected === true || 
                        vpsStatus.status?.connected === true ||
                        vpsStatus.state === 'CONNECTED' ||
                        vpsStatus.status?.state === 'CONNECTED';
    
    const vpsPhone = vpsStatus.phone || 
                    vpsStatus.status?.phone || 
                    vpsStatus.number || 
                    vpsStatus.status?.number || 
                    '';
    
    const vpsName = vpsStatus.name || 
                   vpsStatus.status?.name ||
                   vpsStatus.profileName || 
                   vpsStatus.status?.profileName || 
                   '';

    const vpsProfilePicUrl = vpsStatus.profilePicUrl || 
                            vpsStatus.status?.profilePicUrl || 
                            '';
    
    // Normalizar valores do banco
    const dbConnected = ['ready', 'open'].includes(instance.connection_status) || 
                       ['ready', 'open'].includes(instance.web_status);
    
    const dbPhone = (instance.phone || '').trim();
    const dbName = (instance.profile_name || '').trim();
    
    console.log('[StatusOperations] DETAILED STATUS COMPARISON:');
    console.log('  VPS Connected:', vpsConnected);
    console.log('  VPS Phone:', vpsPhone);
    console.log('  VPS Name:', vpsName);
    console.log('  DB Connected:', dbConnected);
    console.log('  DB Phone:', dbPhone);
    console.log('  DB Name:', dbName);
    console.log('  Connection Status (DB):', instance.connection_status);
    console.log('  Web Status (DB):', instance.web_status);
    console.log('  Force Update:', forceUpdate);

    // Lógica de atualização corrigida
    const updateData: any = {};
    let needsUpdate = false;
    let updateReason = '';

    // CONDIÇÃO 1: VPS conectado mas DB não conectado
    if (vpsConnected && !dbConnected) {
      updateData.web_status = 'ready';
      updateData.connection_status = 'open';
      updateData.date_connected = new Date().toISOString();
      updateData.qr_code = null;
      needsUpdate = true;
      updateReason += 'VPS conectado mas DB desconectado; ';
    }

    // CONDIÇÃO 2: VPS desconectado mas DB conectado
    if (!vpsConnected && dbConnected) {
      updateData.web_status = 'disconnected';
      updateData.connection_status = 'disconnected';
      updateData.date_disconnected = new Date().toISOString();
      needsUpdate = true;
      updateReason += 'VPS desconectado mas DB conectado; ';
    }

    // CONDIÇÃO 3: Telefone diferente (apenas se VPS conectado e tem telefone)
    if (vpsConnected && vpsPhone && vpsPhone !== dbPhone) {
      updateData.phone = vpsPhone;
      needsUpdate = true;
      updateReason += `Telefone diferente (VPS: ${vpsPhone}, DB: ${dbPhone}); `;
    }

    // CONDIÇÃO 4: Nome do perfil diferente
    if (vpsConnected && vpsName && vpsName !== dbName) {
      updateData.profile_name = vpsName;
      needsUpdate = true;
      updateReason += `Nome diferente (VPS: ${vpsName}, DB: ${dbName}); `;
    }

    // CONDIÇÃO 5: URL da foto do perfil diferente
    if (vpsConnected && vpsProfilePicUrl && vpsProfilePicUrl !== instance.profile_pic_url) {
      updateData.profile_pic_url = vpsProfilePicUrl;
      needsUpdate = true;
      updateReason += 'Foto do perfil diferente; ';
    }

    // CONDIÇÃO 6: Forçar atualização (para casos manuais)
    if (forceUpdate) {
      if (vpsConnected) {
        updateData.web_status = 'ready';
        updateData.connection_status = 'open';
        updateData.date_connected = new Date().toISOString();
        updateData.qr_code = null;
        if (vpsPhone) updateData.phone = vpsPhone;
        if (vpsName) updateData.profile_name = vpsName;
        if (vpsProfilePicUrl) updateData.profile_pic_url = vpsProfilePicUrl;
      } else {
        updateData.web_status = 'disconnected';
        updateData.connection_status = 'disconnected';
        updateData.date_disconnected = new Date().toISOString();
      }
      needsUpdate = true;
      updateReason += 'Forçar atualização manual; ';
    }

    console.log('[StatusOperations] UPDATE DECISION:');
    console.log('  Needs Update:', needsUpdate);
    console.log('  Update Reason:', updateReason);
    console.log('  Update Data:', JSON.stringify(updateData, null, 2));

    // Executar atualização se necessário
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

      console.log('[StatusOperations] Instance updated successfully!');
      console.log('[StatusOperations] Updated instance:', JSON.stringify(updatedInstance, null, 2));
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated: true,
          instance: updatedInstance,
          vpsStatus,
          changes: updateData,
          reason: updateReason.trim()
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

export async function forceSync(supabase: any, vpsInstanceId: string) {
  console.log('[StatusOperations] Force syncing instance:', vpsInstanceId);
  return await syncInstanceStatus(supabase, vpsInstanceId, true);
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
