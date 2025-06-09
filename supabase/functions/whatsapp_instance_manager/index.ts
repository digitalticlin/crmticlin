import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO FINAL: Timeout aumentado para 60s + fallback assíncrono
const VPS_CONFIG = {
  primaryUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 60000, // CORREÇÃO FINAL: 60 segundos
  maxRetries: 3,
  retryDelay: 2000,
  webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
  asyncFallback: true // NOVO: Fallback assíncrono
};

serve(async (req) => {
  const startTime = Date.now();
  console.log('[Instance Manager] 🚀 CORREÇÃO FINAL: Timeout 60s + fallback assíncrono:', req.method, `[${startTime}]`);
  
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
      console.error('[Instance Manager] ❌ CORREÇÃO FINAL: Erro de autenticação:', authError);
      throw new Error('Usuário não autenticado');
    }

    console.log('[Instance Manager] ✅ CORREÇÃO FINAL: Usuário autenticado:', user.id, `[${Date.now() - startTime}ms]`);

    const { action, instanceName, instanceId } = await req.json();

    if (action === 'create_instance') {
      return await createInstanceWithAsyncFallback(supabase, instanceName, user, startTime);
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
    console.error('[Instance Manager] ❌ CORREÇÃO FINAL: Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      final_corrections_applied: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// CORREÇÃO FINAL: Função de retry com timeout 60s
async function fetchWithRetryFinal(url: string, options: any, creationId: string, operation: string) {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= VPS_CONFIG.maxRetries; attempt++) {
    const startTime = Date.now();
    console.log(`[Instance Manager] 🔄 CORREÇÃO FINAL: Tentativa ${attempt}/${VPS_CONFIG.maxRetries} - ${operation} [${creationId}]`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[Instance Manager] ⏰ CORREÇÃO FINAL: Timeout ${VPS_CONFIG.timeout}ms na tentativa ${attempt} [${creationId}]`);
        controller.abort();
      }, VPS_CONFIG.timeout);
      
      // CORREÇÃO FINAL: Headers ultra-otimizados
      const finalOptimizedOptions = {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=120, max=200',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Bypass-Cache': 'true',
          'X-Forwarded-Proto': 'http',
          'X-Real-IP': 'direct',
          'X-Forwarded-For': 'edge-function',
          'User-Agent': 'Supabase-Edge-Function-Final-Optimized/3.0',
          'Accept-Encoding': 'identity',
          'X-Request-Priority': 'high'
        }
      };
      
      const response = await fetch(url, finalOptimizedOptions);
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      console.log(`[Instance Manager] ✅ CORREÇÃO FINAL: Sucesso tentativa ${attempt} em ${responseTime}ms [${creationId}]`);
      
      return response;
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      lastError = error;
      
      console.log(`[Instance Manager] ❌ CORREÇÃO FINAL: Tentativa ${attempt} falhou em ${responseTime}ms: ${error.message} [${creationId}]`);
      
      // Se não é a última tentativa, aguardar com backoff exponencial
      if (attempt < VPS_CONFIG.maxRetries) {
        const delay = VPS_CONFIG.retryDelay * Math.pow(2, attempt - 1);
        console.log(`[Instance Manager] ⏳ CORREÇÃO FINAL: Aguardando ${delay}ms antes da próxima tentativa [${creationId}]`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Todas as tentativas falharam');
}

// CORREÇÃO FINAL: Criação com fallback assíncrono
async function createInstanceWithAsyncFallback(supabase: any, instanceName: string, user: any, startTime: number) {
  const creationId = `final_${Date.now()}`;
  console.log(`[Instance Manager] 🎯 CORREÇÃO FINAL: Criação com timeout 60s + fallback [${creationId}]:`, instanceName, `[${Date.now() - startTime}ms]`);

  try {
    // 1. Validação rápida
    if (!instanceName || instanceName.trim().length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const sanitizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const sessionName = `${sanitizedName}_${timestamp}`;
    const vpsInstanceId = sessionName;

    console.log(`[Instance Manager] 📋 CORREÇÃO FINAL: Criando registro no banco PRIMEIRO [${creationId}]:`, vpsInstanceId, `[${Date.now() - startTime}ms]`);

    // 2. SALVAR NO BANCO PRIMEIRO (fallback assíncrono)
    const instanceRecord = {
      instance_name: sanitizedName,
      vps_instance_id: vpsInstanceId,
      connection_type: 'web',
      connection_status: 'creating',
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
      console.error(`[Instance Manager] ❌ CORREÇÃO FINAL: Erro no banco [${creationId}]:`, dbError, `[${Date.now() - startTime}ms]`);
      throw new Error(`Erro no banco: ${dbError.message}`);
    }

    console.log(`[Instance Manager] ✅ CORREÇÃO FINAL: Instância salva no banco [${creationId}]:`, instance.id, `[${Date.now() - startTime}ms]`);

    // 3. RESPOSTA IMEDIATA + processamento assíncrono
    console.log(`[Instance Manager] 🚀 CORREÇÃO FINAL: Retornando resposta imediata + processamento assíncrono [${creationId}]`);

    // NOVO: Processamento VPS em background (sem aguardar)
    createVPSInstanceAsync(supabase, instance, vpsInstanceId, creationId);

    return new Response(JSON.stringify({
      success: true,
      instance: instance,
      vpsInstanceId: vpsInstanceId,
      finalCorrection: true,
      creationId,
      totalTime: Date.now() - startTime,
      processing: 'async',
      message: 'Instância criada - VPS sendo configurada em background',
      corrections: {
        timeout_used: VPS_CONFIG.timeout,
        async_fallback: true,
        immediate_response: true
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO FINAL: Erro geral [${creationId}]:`, error, `[${Date.now() - startTime}ms]`);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      creationId,
      totalTime: Date.now() - startTime,
      finalCorrection: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// NOVO: Processamento VPS assíncrono em background
async function createVPSInstanceAsync(supabase: any, instance: any, vpsInstanceId: string, creationId: string) {
  console.log(`[Instance Manager] 🔄 CORREÇÃO FINAL: Iniciando processamento VPS assíncrono [${creationId}]`);
  
  try {
    const vpsPayload = {
      instanceId: vpsInstanceId,
      sessionName: vpsInstanceId,
      webhookUrl: VPS_CONFIG.webhookUrl
    };

    console.log(`[Instance Manager] 📡 CORREÇÃO FINAL: Tentando VPS com timeout 60s [${creationId}]`);
    
    const vpsResult = await sendToVPSFinal(vpsPayload, creationId);
    
    if (vpsResult.success) {
      console.log(`[Instance Manager] ✅ CORREÇÃO FINAL: VPS configurada com sucesso [${creationId}]`);
      
      // Atualizar status no banco
      await supabase
        .from('whatsapp_instances')
        .update({
          connection_status: 'waiting_qr',
          web_status: 'ready',
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id);
        
    } else {
      console.error(`[Instance Manager] ❌ CORREÇÃO FINAL: VPS falhou após 60s + retry [${creationId}]:`, vpsResult.error);
      
      // Marcar como erro no banco
      await supabase
        .from('whatsapp_instances')
        .update({
          connection_status: 'error',
          web_status: 'vps_failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id);
    }
    
  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO FINAL: Erro no processamento assíncrono [${creationId}]:`, error);
    
    // Marcar como erro no banco
    await supabase
      .from('whatsapp_instances')
      .update({
        connection_status: 'error',
        web_status: 'async_failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);
  }
}

async function sendToVPSFinal(payload: any, creationId: string) {
  try {
    console.log(`[Instance Manager] 📤 CORREÇÃO FINAL: Request para VPS com timeout 60s [${creationId}]`);
    
    const response = await fetchWithRetryFinal(
      `${VPS_CONFIG.primaryUrl}/instance/create`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        },
        body: JSON.stringify(payload)
      },
      creationId,
      'vps-create-instance-final'
    );

    console.log(`[Instance Manager] 📥 CORREÇÃO FINAL: Response ${response.status} [${creationId}]`);

    if (response.ok) {
      const data = await response.json();
      console.log(`[Instance Manager] ✅ CORREÇÃO FINAL: Sucesso VPS com timeout 60s [${creationId}]:`, data);
      return { success: true, data };
    } else if (response.status === 409) {
      console.log(`[Instance Manager] ⚠️ CORREÇÃO FINAL: Instância já existe [${creationId}]`);
      return { 
        success: true, 
        data: { 
          message: 'Instance already exists',
          instanceId: payload.instanceId 
        } 
      };
    } else {
      const errorText = await response.text();
      console.error(`[Instance Manager] ❌ CORREÇÃO FINAL: HTTP ${response.status} [${creationId}]:`, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO FINAL: Erro VPS com timeout 60s [${creationId}]:`, error.message);
    return { success: false, error: error.message };
  }
}

// ... keep existing code (syncInstanceStatus, deleteInstanceCorrected, checkVPSStatus functions)
async function syncInstanceStatus(supabase: any, instanceId: string, user: any) {
  try {
    console.log(`[Instance Manager] 🔄 CORREÇÃO FINAL: Sincronizando status para ${instanceId}`);
    
    // Buscar instância no banco
    const { data: instance, error: findError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (findError || !instance?.vps_instance_id) {
      throw new Error('Instância não encontrada');
    }

    // Buscar status na VPS com retry
    try {
      const response = await fetchWithRetryFinal(
        `${VPS_CONFIG.primaryUrl}/instance/${instance.vps_instance_id}/status`,
        { method: 'GET' },
        `sync_${Date.now()}`,
        'sync-status'
      );

      if (response.ok) {
        const vpsData = await response.json();
        
        // Atualizar banco com dados da VPS
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
          finalCorrection: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        throw new Error(`VPS respondeu com status ${response.status}`);
      }
    } catch (vpsError) {
      // Se VPS falhar, retornar dados do banco
      return new Response(JSON.stringify({
        success: true,
        instance: instance,
        warning: 'VPS inacessível, dados do banco de dados',
        finalCorrection: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO FINAL: Erro no sync:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      finalCorrection: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function deleteInstanceCorrected(supabase: any, instanceId: string, user: any) {
  try {
    console.log(`[Instance Manager] 🗑️ CORREÇÃO FINAL: Deletando com timeout 60s:`, instanceId);

    // Buscar instância
    const { data: instance, error: findError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (findError) {
      throw new Error('Instância não encontrada');
    }

    // Tentar deletar da VPS se tiver vps_instance_id
    if (instance.vps_instance_id) {
      try {
        await fetchWithRetryFinal(
          `${VPS_CONFIG.primaryUrl}/instance/${instance.vps_instance_id}/delete`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${VPS_CONFIG.authToken}`
            }
          },
          `delete_${Date.now()}`,
          'delete-vps-instance'
        );
        console.log(`[Instance Manager] ✅ CORREÇÃO FINAL: VPS deletada com sucesso`);
      } catch (vpsError) {
        console.log(`[Instance Manager] ⚠️ CORREÇÃO FINAL: Erro na VPS ignorado:`, vpsError.message);
        // Continuar mesmo se VPS falhar
      }
    }

    // Deletar do banco
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
      finalCorrection: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO FINAL: Erro ao deletar:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      finalCorrection: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function checkVPSStatus(supabase: any, instanceId: string, user: any) {
  try {
    console.log(`[Instance Manager] 📊 CORREÇÃO FINAL: Verificando status VPS:`, instanceId);

    const { data: instance, error: findError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (findError || !instance) {
      throw new Error('Instância não encontrada');
    }

    // Testar conectividade com VPS usando retry
    try {
      const response = await fetchWithRetryFinal(
        `${VPS_CONFIG.primaryUrl}/health`,
        { method: 'GET' },
        `health_${Date.now()}`,
        'health-check'
      );

      const isHealthy = response.ok;
      const responseData = isHealthy ? await response.json() : null;

      return new Response(JSON.stringify({
        success: true,
        vpsStatus: {
          online: isHealthy,
          responseTime: 'optimized_60s',
          finalCorrection: true,
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
          finalCorrection: true
        },
        instance: instance
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO FINAL: Erro no check VPS:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      finalCorrection: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
