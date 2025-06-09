import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO: Configuração VPS otimizada com timeout 45s e retry
const VPS_CONFIG = {
  primaryUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 45000, // CORREÇÃO: 45 segundos (baseado na análise de logs)
  maxRetries: 3,   // CORREÇÃO: 3 tentativas
  retryDelay: 2000, // CORREÇÃO: 2s entre tentativas
  webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
};

serve(async (req) => {
  const startTime = Date.now();
  console.log('[Instance Manager] 🚀 CORREÇÃO: Requisição com timeout 45s e retry:', req.method, `[${startTime}]`);
  
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
      console.error('[Instance Manager] ❌ CORREÇÃO: Erro de autenticação:', authError);
      throw new Error('Usuário não autenticado');
    }

    console.log('[Instance Manager] ✅ CORREÇÃO: Usuário autenticado:', user.id, `[${Date.now() - startTime}ms]`);

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
    console.error('[Instance Manager] ❌ CORREÇÃO: Erro:', error);
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

// CORREÇÃO: Função de retry com backoff exponencial
async function fetchWithRetry(url: string, options: any, creationId: string, operation: string) {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= VPS_CONFIG.maxRetries; attempt++) {
    const startTime = Date.now();
    console.log(`[Instance Manager] 🔄 CORREÇÃO: Tentativa ${attempt}/${VPS_CONFIG.maxRetries} - ${operation} [${creationId}]`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[Instance Manager] ⏰ CORREÇÃO: Timeout ${VPS_CONFIG.timeout}ms na tentativa ${attempt} [${creationId}]`);
        controller.abort();
      }, VPS_CONFIG.timeout);
      
      // CORREÇÃO: Headers otimizados para performance
      const optimizedOptions = {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=60, max=100',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
          'X-Bypass-Cache': 'true',
          'X-Forwarded-Proto': 'http',
          'User-Agent': 'Supabase-Edge-Function-WhatsApp-Corrected/2.0'
        }
      };
      
      const response = await fetch(url, optimizedOptions);
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      console.log(`[Instance Manager] ✅ CORREÇÃO: Sucesso tentativa ${attempt} em ${responseTime}ms [${creationId}]`);
      
      return response;
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      lastError = error;
      
      console.log(`[Instance Manager] ❌ CORREÇÃO: Tentativa ${attempt} falhou em ${responseTime}ms: ${error.message} [${creationId}]`);
      
      // Se não é a última tentativa, aguardar com backoff exponencial
      if (attempt < VPS_CONFIG.maxRetries) {
        const delay = VPS_CONFIG.retryDelay * Math.pow(2, attempt - 1);
        console.log(`[Instance Manager] ⏳ CORREÇÃO: Aguardando ${delay}ms antes da próxima tentativa [${creationId}]`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Todas as tentativas falharam');
}

async function createInstanceCorrected(supabase: any, instanceName: string, user: any, startTime: number) {
  const creationId = `corrected_${Date.now()}`;
  console.log(`[Instance Manager] 🎯 CORREÇÃO: Criação com timeout 45s e retry [${creationId}]:`, instanceName, `[${Date.now() - startTime}ms]`);

  try {
    // 1. Validação rápida
    if (!instanceName || instanceName.trim().length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const sanitizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const sessionName = `${sanitizedName}_${timestamp}`;
    const vpsInstanceId = sessionName;

    console.log(`[Instance Manager] 📋 CORREÇÃO: Payload otimizado [${creationId}]:`, vpsInstanceId, `[${Date.now() - startTime}ms]`);

    // 2. PAYLOAD CORRIGIDO - otimizado para performance
    const vpsPayload = {
      instanceId: vpsInstanceId,
      sessionName: sessionName,
      webhookUrl: VPS_CONFIG.webhookUrl
    };

    // 3. ENVIAR PARA VPS - com retry e timeout 45s
    console.log(`[Instance Manager] 📡 CORREÇÃO: Enviando para VPS com retry [${creationId}]:`, `[${Date.now() - startTime}ms]`);
    
    const vpsResult = await sendToVPSCorrected(vpsPayload, creationId, startTime);
    
    if (!vpsResult.success) {
      console.error(`[Instance Manager] ❌ CORREÇÃO: VPS falhou após retry [${creationId}]:`, vpsResult.error, `[${Date.now() - startTime}ms]`);
      throw new Error(`VPS falhou: ${vpsResult.error}`);
    }

    console.log(`[Instance Manager] ✅ CORREÇÃO: VPS sucesso após retry [${creationId}]:`, `[${Date.now() - startTime}ms]`);

    // 4. Salvar no banco (apenas após VPS confirmar)
    const instanceRecord = {
      instance_name: sanitizedName,
      vps_instance_id: vpsInstanceId,
      connection_type: 'web',
      connection_status: 'waiting_qr',
      created_by_user_id: user.id,
      server_url: VPS_CONFIG.primaryUrl,
      company_id: null
    };

    console.log(`[Instance Manager] 💾 CORREÇÃO: Salvando no banco [${creationId}]:`, `[${Date.now() - startTime}ms]`);
    
    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceRecord)
      .select()
      .single();

    if (dbError) {
      console.error(`[Instance Manager] ❌ CORREÇÃO: Erro no banco [${creationId}]:`, dbError, `[${Date.now() - startTime}ms]`);
      throw new Error(`Erro no banco: ${dbError.message}`);
    }

    console.log(`[Instance Manager] ✅ CORREÇÃO: Instância completa [${creationId}]:`, instance.id, `[${Date.now() - startTime}ms]`);

    return new Response(JSON.stringify({
      success: true,
      instance: instance,
      vpsInstanceId: vpsInstanceId,
      corrected: true,
      creationId,
      totalTime: Date.now() - startTime,
      vpsResponse: vpsResult.data,
      corrections: {
        timeout_used: VPS_CONFIG.timeout,
        retry_successful: true,
        max_retries: VPS_CONFIG.maxRetries
      },
      message: 'Instância criada com sucesso - versão corrigida com timeout 45s'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO: Erro geral [${creationId}]:`, error, `[${Date.now() - startTime}ms]`);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      creationId,
      totalTime: Date.now() - startTime,
      corrected: true,
      corrections_attempted: {
        timeout: VPS_CONFIG.timeout,
        max_retries: VPS_CONFIG.maxRetries
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function sendToVPSCorrected(payload: any, creationId: string, startTime: number) {
  try {
    console.log(`[Instance Manager] 📤 CORREÇÃO: Request para VPS com retry [${creationId}] [${Date.now() - startTime}ms]`);
    
    const response = await fetchWithRetry(
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
      'vps-create-instance'
    );

    console.log(`[Instance Manager] 📥 CORREÇÃO: Response ${response.status} [${creationId}] [${Date.now() - startTime}ms]`);

    if (response.ok) {
      const data = await response.json();
      console.log(`[Instance Manager] ✅ CORREÇÃO: Sucesso VPS após retry [${creationId}]:`, data);
      return { success: true, data };
    } else if (response.status === 409) {
      // Instância já existe - considerar sucesso
      console.log(`[Instance Manager] ⚠️ CORREÇÃO: Instância já existe [${creationId}]`);
      return { 
        success: true, 
        data: { 
          message: 'Instance already exists',
          instanceId: payload.instanceId 
        } 
      };
    } else {
      const errorText = await response.text();
      console.error(`[Instance Manager] ❌ CORREÇÃO: HTTP ${response.status} [${creationId}]:`, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO: Erro VPS após retry [${creationId}]:`, error.message, `[${Date.now() - startTime}ms]`);
    return { success: false, error: error.message };
  }
}

async function syncInstanceStatus(supabase: any, instanceId: string, user: any) {
  try {
    console.log(`[Instance Manager] 🔄 CORREÇÃO: Sincronizando status para ${instanceId}`);
    
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
      const response = await fetchWithRetry(
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
          corrected: true
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
        corrected: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO: Erro no sync:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      corrected: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function deleteInstanceCorrected(supabase: any, instanceId: string, user: any) {
  try {
    console.log(`[Instance Manager] 🗑️ CORREÇÃO: Deletando com retry:`, instanceId);

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
        await fetchWithRetry(
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
        console.log(`[Instance Manager] ✅ CORREÇÃO: VPS deletada com sucesso`);
      } catch (vpsError) {
        console.log(`[Instance Manager] ⚠️ CORREÇÃO: Erro na VPS ignorado:`, vpsError.message);
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
      corrected: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO: Erro ao deletar:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      corrected: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function checkVPSStatus(supabase: any, instanceId: string, user: any) {
  try {
    console.log(`[Instance Manager] 📊 CORREÇÃO: Verificando status VPS:`, instanceId);

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
      const response = await fetchWithRetry(
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
          responseTime: 'optimized',
          corrected: true,
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
          corrected: true
        },
        instance: instance
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO: Erro no check VPS:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      corrected: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
