
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO APLICADA: Headers simplificados + timeout aumentado + payload corrigido
const VPS_CONFIG = {
  primaryUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 15000, // CORREÇÃO 1: Aumentado de 3s para 15s
  webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
  instantResponse: true,
  asyncDelay: 500
};

serve(async (req) => {
  const startTime = Date.now();
  console.log('[Instance Manager] 🚀 CORREÇÃO APLICADA: Headers simplificados + timeout 15s:', req.method, `[${startTime}]`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[Instance Manager] ❌ Erro de autenticação:', authError);
      throw new Error('Usuário não autenticado');
    }

    console.log('[Instance Manager] ✅ Usuário autenticado:', user.id, `[${Date.now() - startTime}ms]`);

    const { action, instanceName, instanceId } = await req.json();

    if (action === 'create_instance') {
      return await createInstanceCorrected(supabase, instanceName, user, startTime);
    }

    if (action === 'delete_instance_corrected') {
      return await deleteInstanceCorrected(supabase, instanceId, user);
    }

    if (action === 'sync_instance_status') {
      return await syncInstanceStatus(supabase, instanceId, user);
    }

    if (action === 'check_vps_status') {
      return await checkVPSStatus(supabase, instanceId, user);
    }

    throw new Error('Ação não reconhecida');

  } catch (error) {
    console.error('[Instance Manager] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      corrections_applied: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// CORREÇÃO PRINCIPAL: Função de criação com headers simplificados
async function createInstanceCorrected(supabase: any, instanceName: string, user: any, startTime: number) {
  const creationId = `corrected_${Date.now()}`;
  console.log(`[Instance Manager] 🔧 CORREÇÃO: Criação com headers simplificados [${creationId}]:`, instanceName);

  try {
    // 1. Validação
    if (!instanceName || instanceName.trim().length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const sanitizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const sessionName = `${sanitizedName}_${timestamp}`;
    const vpsInstanceId = sessionName;

    // 2. Buscar company_id do usuário
    let companyId = null;
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (userProfile?.company_id) {
      companyId = userProfile.company_id;
    }

    console.log(`[Instance Manager] 📋 CORREÇÃO: Company ID encontrado: ${companyId} [${creationId}]`);

    // 3. Salvar no banco PRIMEIRO
    const instanceRecord = {
      instance_name: sanitizedName,
      vps_instance_id: vpsInstanceId,
      connection_type: 'web',
      connection_status: 'creating',
      web_status: 'initializing',
      created_by_user_id: user.id,
      server_url: VPS_CONFIG.primaryUrl,
      company_id: companyId
    };

    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceRecord)
      .select()
      .single();

    if (dbError) {
      console.error(`[Instance Manager] ❌ Erro no banco [${creationId}]:`, dbError);
      throw new Error(`Erro no banco: ${dbError.message}`);
    }

    console.log(`[Instance Manager] ✅ Instância salva [${creationId}]:`, instance.id);

    // 4. RESPOSTA INSTANTÂNEA
    console.log(`[Instance Manager] 🚀 CORREÇÃO: Retornando resposta instantânea [${creationId}]`);

    // 5. PROCESSAR VPS EM BACKGROUND com correções
    setTimeout(() => {
      initializeVPSCorrected(supabase, instance, vpsInstanceId, creationId, companyId);
    }, VPS_CONFIG.asyncDelay);

    return new Response(JSON.stringify({
      success: true,
      instance: instance,
      vpsInstanceId: vpsInstanceId,
      corrections_applied: true,
      creationId,
      totalTime: Date.now() - startTime,
      message: 'Instância criada - correções aplicadas (headers simplificados, timeout 15s, companyId incluído)'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro na criação corrigida [${creationId}]:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      creationId,
      totalTime: Date.now() - startTime,
      corrections_applied: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// CORREÇÃO PRINCIPAL: Inicialização VPS com headers simples do servidor antigo
async function initializeVPSCorrected(supabase: any, instance: any, vpsInstanceId: string, creationId: string, companyId: any) {
  console.log(`[Instance Manager] 🔧 CORREÇÃO: Inicializando VPS com headers simples [${creationId}]`);
  
  try {
    // CORREÇÃO: Payload idêntico ao servidor antigo + companyId
    const vpsPayload = {
      instanceId: vpsInstanceId,
      sessionName: vpsInstanceId,
      webhookUrl: VPS_CONFIG.webhookUrl,
      companyId: companyId || instance.created_by_user_id // CORREÇÃO: CompanyId incluído
    };

    console.log(`[Instance Manager] 📤 CORREÇÃO: Payload corrigido [${creationId}]:`, vpsPayload);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[Instance Manager] ⏰ CORREÇÃO: Timeout 15s aplicado [${creationId}]`);
      controller.abort();
    }, VPS_CONFIG.timeout); // 15s timeout

    // CORREÇÃO: Headers SIMPLES como servidor antigo espera
    const response = await fetch(`${VPS_CONFIG.primaryUrl}/instance/create`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        // CORREÇÃO: Removidos todos os headers extras (X-API-Token, User-Agent complexo, Connection: close)
      },
      body: JSON.stringify(vpsPayload)
    });

    clearTimeout(timeoutId);
    
    if (response.ok) {
      const responseData = await response.text();
      console.log(`[Instance Manager] ✅ CORREÇÃO: VPS respondeu com sucesso [${creationId}]:`, responseData.substring(0, 200));
      
      // Atualizar status para aguardando QR
      await supabase
        .from('whatsapp_instances')
        .update({
          connection_status: 'waiting_qr',
          web_status: 'ready',
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id);
        
    } else {
      console.error(`[Instance Manager] ❌ CORREÇÃO: VPS falhou HTTP ${response.status} [${creationId}]`);
      
      // Marcar como erro
      await supabase
        .from('whatsapp_instances')
        .update({
          connection_status: 'error',
          web_status: 'vps_error_after_correction',
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id);
    }
    
  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO: Erro na inicialização VPS [${creationId}]:`, error);
    
    // Marcar como erro de conectividade
    await supabase
      .from('whatsapp_instances')
      .update({
        connection_status: 'error',
        web_status: 'connectivity_error_after_correction',
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);
  }
}

// ... keep existing code (syncInstanceStatus, deleteInstanceCorrected, checkVPSStatus functions)
async function syncInstanceStatus(supabase: any, instanceId: string, user: any) {
  try {
    console.log(`[Instance Manager] 🔄 Sincronizando status para ${instanceId}`);
    
    const { data: instance, error: findError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (findError || !instance?.vps_instance_id) {
      throw new Error('Instância não encontrada');
    }

    // Buscar status na VPS com headers corrigidos
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeout);

      const response = await fetch(`${VPS_CONFIG.primaryUrl}/instance/${instance.vps_instance_id}/status`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const vpsData = await response.json();
        
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({
            connection_status: vpsData.status || instance.connection_status,
            qr_code: vpsData.qrCode || instance.qr_code,
            updated_at: new Date().toISOString()
          })
          .eq('id', instanceId);

        if (updateError) {
          throw new Error(`Erro ao atualizar: ${updateError.message}`);
        }

        return new Response(JSON.stringify({
          success: true,
          instance: {
            ...instance,
            connection_status: vpsData.status || instance.connection_status,
            qr_code: vpsData.qrCode || instance.qr_code
          },
          corrections_applied: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        throw new Error(`VPS respondeu com status ${response.status}`);
      }
    } catch (vpsError) {
      return new Response(JSON.stringify({
        success: true,
        instance: instance,
        warning: 'VPS inacessível, dados do banco de dados',
        corrections_applied: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro no sync:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      corrections_applied: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function deleteInstanceCorrected(supabase: any, instanceId: string, user: any) {
  try {
    console.log(`[Instance Manager] 🗑️ Deletando:`, instanceId);

    const { data: instance, error: findError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (findError) {
      throw new Error('Instância não encontrada');
    }

    if (instance.vps_instance_id) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeout);

        await fetch(`${VPS_CONFIG.primaryUrl}/instance/${instance.vps_instance_id}/delete`, {
          method: 'DELETE',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${VPS_CONFIG.authToken}`
          }
        });
        
        clearTimeout(timeoutId);
        console.log(`[Instance Manager] ✅ VPS deletada com sucesso`);
      } catch (vpsError) {
        console.log(`[Instance Manager] ⚠️ Erro na VPS ignorado:`, vpsError.message);
      }
    }

    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(`Erro ao deletar: ${deleteError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Instância deletada com sucesso',
      corrections_applied: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro ao deletar:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      corrections_applied: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function checkVPSStatus(supabase: any, instanceId: string, user: any) {
  try {
    console.log(`[Instance Manager] 📊 Verificando status VPS:`, instanceId);

    const { data: instance, error: findError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (findError || !instance) {
      throw new Error('Instância não encontrada');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeout);

      const response = await fetch(`${VPS_CONFIG.primaryUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        }
      });

      clearTimeout(timeoutId);
      const isHealthy = response.ok;
      const responseData = isHealthy ? await response.json() : null;

      return new Response(JSON.stringify({
        success: true,
        vpsStatus: {
          online: isHealthy,
          responseTime: 'corrected_15s_timeout',
          corrections_applied: true,
          details: responseData
        },
        instance: instance
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (vpsError) {
      return new Response(JSON.stringify({
        success: true,
        vpsStatus: {
          online: false,
          error: vpsError.message,
          corrections_applied: true
        },
        instance: instance
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro no check VPS:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      corrections_applied: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
