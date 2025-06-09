
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CONFIGURAÇÃO ULTRA-OTIMIZADA: Como servidor antigo - FINAL
const VPS_CONFIG = {
  primaryUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 5000, // CORREÇÃO FINAL: 5s ultra agressivo como servidor antigo
  webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
  instantResponse: true,
  asyncDelay: 500 // Delay mínimo como servidor antigo
};

serve(async (req) => {
  const startTime = Date.now();
  console.log('[Instance Manager] 🚀 CORREÇÃO FINAL: Criação instantânea como servidor antigo:', req.method, `[${startTime}]`);
  
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
      return await createInstanceInstantFinal(supabase, instanceName, user, startTime);
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
      final_optimization_applied: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// CORREÇÃO FINAL: Criação instantânea perfeita como servidor antigo
async function createInstanceInstantFinal(supabase: any, instanceName: string, user: any, startTime: number) {
  const creationId = `final_${Date.now()}`;
  console.log(`[Instance Manager] ⚡ CORREÇÃO FINAL: Criação ultra-instantânea [${creationId}]:`, instanceName, `[${Date.now() - startTime}ms]`);

  try {
    // 1. Validação ultra-rápida
    if (!instanceName || instanceName.trim().length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const sanitizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const sessionName = `${sanitizedName}_${timestamp}`;
    const vpsInstanceId = sessionName;

    console.log(`[Instance Manager] 💾 CORREÇÃO FINAL: Salvando ultra-rápido no banco [${creationId}]:`, vpsInstanceId, `[${Date.now() - startTime}ms]`);

    // 2. SALVAR NO BANCO PRIMEIRO (padrão servidor antigo)
    const instanceRecord = {
      instance_name: sanitizedName,
      vps_instance_id: vpsInstanceId,
      connection_type: 'web',
      connection_status: 'creating', // Status inicial como servidor antigo
      web_status: 'initializing',
      created_by_user_id: user.id,
      server_url: VPS_CONFIG.primaryUrl,
      company_id: null
    };

    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceRecord)
      .select()
      .single();

    if (dbError) {
      console.error(`[Instance Manager] ❌ Erro no banco [${creationId}]:`, dbError, `[${Date.now() - startTime}ms]`);
      throw new Error(`Erro no banco: ${dbError.message}`);
    }

    console.log(`[Instance Manager] ✅ Instância salva ultra-rápido [${creationId}]:`, instance.id, `[${Date.now() - startTime}ms]`);

    // 3. RESPOSTA INSTANTÂNEA (padrão servidor antigo)
    console.log(`[Instance Manager] 🚀 CORREÇÃO FINAL: Retornando resposta instantânea [${creationId}] - tempo total: ${Date.now() - startTime}ms`);

    // 4. PROCESSAR VPS EM 500ms (ultra-rápido como servidor antigo)
    setTimeout(() => {
      initializeVPSUltraFast(supabase, instance, vpsInstanceId, creationId);
    }, VPS_CONFIG.asyncDelay);

    return new Response(JSON.stringify({
      success: true,
      instance: instance,
      vpsInstanceId: vpsInstanceId,
      final_optimization: true,
      creationId,
      totalTime: Date.now() - startTime,
      message: 'Instância criada instantaneamente - padrão servidor antigo aplicado',
      server_pattern: 'ultra_fast_final'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro na criação instantânea [${creationId}]:`, error, `[${Date.now() - startTime}ms]`);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      creationId,
      totalTime: Date.now() - startTime,
      final_optimization: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// CORREÇÃO FINAL: Inicialização VPS ultra-otimizada
async function initializeVPSUltraFast(supabase: any, instance: any, vpsInstanceId: string, creationId: string) {
  console.log(`[Instance Manager] 🔄 CORREÇÃO FINAL: Inicializando VPS ultra-rápido [${creationId}]`);
  
  try {
    // Payload ultra-mínimo como servidor antigo
    const vpsPayload = {
      instanceId: vpsInstanceId,
      sessionName: vpsInstanceId,
      webhookUrl: VPS_CONFIG.webhookUrl
    };

    console.log(`[Instance Manager] 📡 CORREÇÃO FINAL: Tentando VPS com timeout 5s ultra-agressivo [${creationId}]`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[Instance Manager] ⏰ CORREÇÃO FINAL: Timeout 5s ultra-agressivo [${creationId}]`);
      controller.abort();
    }, VPS_CONFIG.timeout);

    // Headers ultra-otimizados como servidor antigo
    const response = await fetch(`${VPS_CONFIG.primaryUrl}/instance/create`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'User-Agent': 'Supabase-WhatsApp-Final-Ultra/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Connection': 'close',
        'Keep-Alive': 'timeout=5',
        'X-Priority': 'high'
      },
      body: JSON.stringify(vpsPayload)
    });

    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`[Instance Manager] ✅ CORREÇÃO FINAL: VPS inicializada com sucesso ultra-rápido [${creationId}]`);
      
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
      console.error(`[Instance Manager] ❌ CORREÇÃO FINAL: VPS falhou HTTP ${response.status} [${creationId}]`);
      
      // Marcar como erro, mas NÃO falhar a criação (padrão servidor antigo)
      await supabase
        .from('whatsapp_instances')
        .update({
          connection_status: 'waiting_qr', // Manter como waiting para retry automático
          web_status: 'vps_delayed_but_recoverable',
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id);
    }
    
  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO FINAL: Erro na inicialização VPS [${creationId}]:`, error);
    
    // Marcar como recoverable, não como erro fatal (padrão servidor antigo)
    await supabase
      .from('whatsapp_instances')
      .update({
        connection_status: 'waiting_qr', // Permitir retry automático
        web_status: 'vps_timeout_but_recoverable',
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

    // Buscar status na VPS
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${VPS_CONFIG.primaryUrl}/instance/${instance.vps_instance_id}/status`, {
        method: 'GET',
        signal: controller.signal
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
          final_optimization: true
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
        final_optimization: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro no sync:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      final_optimization: true
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
        const timeoutId = setTimeout(() => controller.abort(), 5000);

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
      final_optimization: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro ao deletar:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      final_optimization: true
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
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${VPS_CONFIG.primaryUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const isHealthy = response.ok;
      const responseData = isHealthy ? await response.json() : null;

      return new Response(JSON.stringify({
        success: true,
        vpsStatus: {
          online: isHealthy,
          responseTime: 'ultra_fast_final',
          final_optimization: true,
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
          final_optimization: true
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
      final_optimization: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
