
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

// Função para adotar instância órfã ativa
async function adoptOrphanInstance(supabase: any, vpsInstance: any, companyId: string) {
  try {
    console.log(`[Adopt] 🆕 Adotando instância órfã ativa: ${vpsInstance.instanceId}`);
    
    // Criar registro no Supabase para a instância órfã ativa
    const adoptedInstance = {
      instance_name: vpsInstance.instanceId || `adopted_${Date.now()}`,
      vps_instance_id: vpsInstance.instanceId,
      connection_type: 'web',
      connection_status: vpsInstance.status || 'open',
      web_status: vpsInstance.status === 'open' ? 'ready' : 'authenticated',
      phone: vpsInstance.phone || '',
      profile_name: vpsInstance.profileName || null,
      server_url: VPS_CONFIG.baseUrl,
      company_id: companyId,
      date_connected: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newInstance, error } = await supabase
      .from('whatsapp_instances')
      .insert(adoptedInstance)
      .select()
      .single();

    if (error) {
      console.error(`[Adopt] ❌ Erro ao adotar instância órfã:`, error);
      throw error;
    }

    console.log(`[Adopt] ✅ Instância órfã adotada com sucesso:`, {
      id: newInstance.id,
      instance_name: newInstance.instance_name,
      vps_instance_id: newInstance.vps_instance_id,
      status: newInstance.connection_status
    });

    return {
      action: 'adopted',
      instanceId: newInstance.id,
      vps_instance_id: vpsInstance.instanceId,
      status: vpsInstance.status,
      phone: vpsInstance.phone || null
    };

  } catch (error) {
    console.error(`[Adopt] ❌ Erro ao processar adoção da instância órfã:`, error);
    return {
      action: 'adoption_failed',
      instanceId: vpsInstance.instanceId,
      error: error.message
    };
  }
}

// Função para verificar se uma instância VPS está ativa/conectada
function isActiveVPSInstance(vpsInstance: any): boolean {
  const activeStatuses = ['open', 'authenticated', 'ready'];
  return activeStatuses.includes(vpsInstance.status);
}

// Função para sincronizar instâncias com lógica mais conservadora e adoção de órfãs
export async function syncInstances(supabase: any, companyId: string) {
  try {
    console.log(`[Sync] 🔄 INICIANDO sync conservador + adoção de órfãs para empresa: ${companyId}`);
    
    // Buscar instâncias do banco
    const { data: dbInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('company_id', companyId)
      .eq('connection_type', 'web');

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log(`[Sync] 📊 Instâncias no banco: ${dbInstances?.length || 0}`);

    // Buscar instâncias do VPS
    let vpsInstances = [];
    let vpsError = null;
    
    try {
      const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instances`, {
        method: 'GET',
        headers: getVPSHeaders()
      });

      if (vpsResponse.ok) {
        const vpsData = await vpsResponse.json();
        vpsInstances = vpsData.instances || [];
        console.log(`[Sync] 🖥️ Instâncias no VPS: ${vpsInstances.length}`);
      } else {
        vpsError = `VPS responded with status: ${vpsResponse.status}`;
        console.error(`[Sync] ❌ VPS error: ${vpsError}`);
      }
    } catch (error) {
      vpsError = error.message;
      console.error(`[Sync] ❌ Failed to fetch VPS instances: ${vpsError}`);
    }

    const syncResults = [];
    let updatedCount = 0;
    let preservedCount = 0;
    let adoptedCount = 0;
    let errorCount = 0;

    // Se há erro no VPS, apenas registrar mas NÃO remover instâncias
    if (vpsError) {
      console.log(`[Sync] ⚠️ VPS inacessível: ${vpsError}. Preservando instâncias existentes.`);
      
      for (const dbInstance of dbInstances || []) {
        syncResults.push({
          instanceId: dbInstance.id,
          action: 'preserved',
          reason: 'vps_unreachable',
          vps_error: vpsError
        });
        preservedCount++;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          results: syncResults,
          summary: {
            updated: 0,
            preserved: preservedCount,
            adopted: 0,
            errors: 1,
            vps_error: vpsError
          },
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ETAPA 1: Sincronizar status das instâncias existentes no banco
    for (const dbInstance of dbInstances || []) {
      try {
        console.log(`[Sync] 🔍 Processando instância: ${dbInstance.instance_name} (${dbInstance.vps_instance_id})`);
        
        const vpsInstance = vpsInstances.find(v => v.instanceId === dbInstance.vps_instance_id);
        
        if (vpsInstance) {
          console.log(`[Sync] ✅ Instância encontrada no VPS: ${vpsInstance.status}`);
          
          // Atualizar status APENAS se houver mudanças significativas
          const updates: any = {};
          let hasChanges = false;
          
          // Verificar mudanças de status
          if (vpsInstance.status && vpsInstance.status !== dbInstance.connection_status) {
            updates.connection_status = vpsInstance.status;
            hasChanges = true;
            console.log(`[Sync] 📝 Status changed: ${dbInstance.connection_status} -> ${vpsInstance.status}`);
          }
          
          // Verificar mudanças de telefone
          if (vpsInstance.phone && vpsInstance.phone !== dbInstance.phone) {
            updates.phone = vpsInstance.phone;
            hasChanges = true;
            console.log(`[Sync] 📱 Phone updated: ${dbInstance.phone} -> ${vpsInstance.phone}`);
          }
          
          // Verificar mudanças de profile
          if (vpsInstance.profileName && vpsInstance.profileName !== dbInstance.profile_name) {
            updates.profile_name = vpsInstance.profileName;
            hasChanges = true;
            console.log(`[Sync] 👤 Profile updated: ${dbInstance.profile_name} -> ${vpsInstance.profileName}`);
          }
          
          if (hasChanges) {
            updates.updated_at = new Date().toISOString();
            
            await supabase
              .from('whatsapp_instances')
              .update(updates)
              .eq('id', dbInstance.id);
              
            syncResults.push({
              instanceId: dbInstance.id,
              action: 'updated',
              changes: updates,
              vps_status: vpsInstance.status
            });
            
            updatedCount++;
            console.log(`[Sync] ✅ Instância atualizada: ${dbInstance.instance_name}`);
          } else {
            syncResults.push({
              instanceId: dbInstance.id,
              action: 'unchanged',
              current_status: dbInstance.connection_status
            });
            preservedCount++;
            console.log(`[Sync] ➡️ Instância inalterada: ${dbInstance.instance_name}`);
          }
        } else {
          // Instância no banco mas não no VPS - MARCAR como desconectada, mas NÃO remover
          console.log(`[Sync] ⚠️ Instância órfã detectada: ${dbInstance.instance_name}. Marcando como desconectada.`);
          
          // Apenas marcar como desconectada se não estava já desconectada
          if (dbInstance.connection_status !== 'disconnected') {
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
              reason: 'not_found_in_vps',
              previous_status: dbInstance.connection_status
            });
            updatedCount++;
          } else {
            syncResults.push({
              instanceId: dbInstance.id,
              action: 'already_disconnected',
              reason: 'not_found_in_vps'
            });
            preservedCount++;
          }
        }
      } catch (instanceError) {
        console.error(`[Sync] ❌ Erro ao processar instância ${dbInstance.instance_name}:`, instanceError);
        syncResults.push({
          instanceId: dbInstance.id,
          action: 'error',
          error: instanceError.message
        });
        errorCount++;
      }
    }

    // ETAPA 2: Detectar e adotar instâncias órfãs ATIVAS no VPS
    console.log(`[Sync] 🔍 Procurando por instâncias órfãs ativas no VPS...`);
    
    for (const vpsInstance of vpsInstances) {
      try {
        // Verificar se a instância do VPS já existe no banco desta empresa
        const existsInDB = dbInstances?.some(db => db.vps_instance_id === vpsInstance.instanceId);
        
        if (!existsInDB) {
          console.log(`[Sync] 🕵️ Instância órfã detectada no VPS: ${vpsInstance.instanceId} (status: ${vpsInstance.status})`);
          
          // Verificar se é uma instância ativa que devemos adotar
          if (isActiveVPSInstance(vpsInstance)) {
            console.log(`[Sync] 🆕 Instância órfã ATIVA encontrada - iniciando adoção: ${vpsInstance.instanceId}`);
            
            const adoptResult = await adoptOrphanInstance(supabase, vpsInstance, companyId);
            syncResults.push(adoptResult);
            
            if (adoptResult.action === 'adopted') {
              adoptedCount++;
              console.log(`[Sync] ✅ Instância órfã adotada: ${vpsInstance.instanceId}`);
            } else {
              errorCount++;
              console.log(`[Sync] ❌ Falha na adoção: ${vpsInstance.instanceId}`);
            }
          } else {
            console.log(`[Sync] 🚫 Instância órfã INATIVA ignorada: ${vpsInstance.instanceId} (status: ${vpsInstance.status})`);
            syncResults.push({
              instanceId: vpsInstance.instanceId,
              action: 'orphan_inactive',
              status: vpsInstance.status,
              reason: 'inactive_not_adopted'
            });
          }
        }
      } catch (orphanError) {
        console.error(`[Sync] ❌ Erro ao processar instância órfã ${vpsInstance.instanceId}:`, orphanError);
        syncResults.push({
          instanceId: vpsInstance.instanceId,
          action: 'orphan_error',
          error: orphanError.message
        });
        errorCount++;
      }
    }

    console.log(`[Sync] 🏁 Sync finalizado: ${updatedCount} atualizadas, ${preservedCount} preservadas, ${adoptedCount} adotadas, ${errorCount} erros`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: syncResults,
        summary: {
          updated: updatedCount,
          preserved: preservedCount,
          adopted: adoptedCount,
          errors: errorCount,
          total_vps_instances: vpsInstances.length,
          total_db_instances: (dbInstances?.length || 0)
        },
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Sync] ❌ ERRO GERAL no sync:', error);
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
