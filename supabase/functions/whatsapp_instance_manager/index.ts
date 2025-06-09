import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO FINAL: Configuração VPS com diagnóstico avançado
const VPS_CONFIG = {
  primaryUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 30000, // AUMENTADO: 30s para dar tempo à VPS
  webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
  instantResponse: true,
  asyncDelay: 500,
  maxRetries: 3,
  retryDelay: 2000
};

// NOVO: Função de diagnóstico VPS
async function diagnosticVPS(): Promise<{healthy: boolean, responseTime: number, error?: string}> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🩺 Testando conectividade VPS...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s para health check
    
    const response = await fetch(`${VPS_CONFIG.primaryUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-WhatsApp-Diagnostic/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.text();
      console.log(`[VPS Diagnostic] ✅ VPS saudável - ${responseTime}ms - Resposta: ${data.substring(0, 100)}`);
      return { healthy: true, responseTime };
    } else {
      console.log(`[VPS Diagnostic] ⚠️ VPS respondeu HTTP ${response.status} - ${responseTime}ms`);
      return { healthy: false, responseTime, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[VPS Diagnostic] ❌ VPS inacessível - ${responseTime}ms - Erro:`, error.message);
    return { healthy: false, responseTime, error: error.message };
  }
}

serve(async (req) => {
  const startTime = Date.now();
  console.log('[Instance Manager] 🚀 DIAGNÓSTICO AVANÇADO:', req.method, `[${startTime}]`);
  
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
      return await createInstanceWithDiagnostic(supabase, instanceName, user, startTime);
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
      diagnosticApplied: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// NOVO: Criação com diagnóstico VPS avançado
async function createInstanceWithDiagnostic(supabase: any, instanceName: string, user: any, startTime: number) {
  const creationId = `diagnostic_${Date.now()}`;
  console.log(`[Instance Manager] 🔧 DIAGNÓSTICO AVANÇADO: Criação [${creationId}]:`, instanceName);

  try {
    // PASSO 1: Diagnóstico VPS ANTES de criar
    console.log(`[Instance Manager] 🩺 FASE 1: Diagnóstico VPS pré-criação [${creationId}]`);
    const vpsHealth = await diagnosticVPS();
    
    if (!vpsHealth.healthy) {
      console.error(`[Instance Manager] ❌ VPS não saudável [${creationId}]:`, vpsHealth);
      throw new Error(`VPS inacessível: ${vpsHealth.error} (${vpsHealth.responseTime}ms)`);
    }

    console.log(`[Instance Manager] ✅ VPS saudável - prosseguindo [${creationId}]`);

    // PASSO 2: Validação e preparação
    if (!instanceName || instanceName.trim().length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const sanitizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const sessionName = `${sanitizedName}_${timestamp}`;
    const vpsInstanceId = sessionName;

    // PASSO 3: Buscar company_id
    let companyId = null;
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (userProfile?.company_id) {
      companyId = userProfile.company_id;
    }

    console.log(`[Instance Manager] 📋 Company ID: ${companyId} [${creationId}]`);

    // PASSO 4: Salvar no banco
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

    // PASSO 5: RESPOSTA INSTANTÂNEA
    console.log(`[Instance Manager] 🚀 Retornando resposta instantânea [${creationId}]`);

    // PASSO 6: PROCESSAR VPS COM RETRY
    setTimeout(() => {
      initializeVPSWithRetry(supabase, instance, vpsInstanceId, creationId, companyId, vpsHealth);
    }, VPS_CONFIG.asyncDelay);

    return new Response(JSON.stringify({
      success: true,
      instance: instance,
      vpsInstanceId: vpsInstanceId,
      vpsHealth: vpsHealth,
      diagnosticApplied: true,
      creationId,
      totalTime: Date.now() - startTime,
      message: 'Instância criada - Diagnóstico VPS aplicado com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro na criação com diagnóstico [${creationId}]:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      creationId,
      totalTime: Date.now() - startTime,
      diagnosticApplied: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// NOVO: Inicialização VPS com retry inteligente
async function initializeVPSWithRetry(supabase: any, instance: any, vpsInstanceId: string, creationId: string, companyId: any, initialHealth: any) {
  console.log(`[Instance Manager] 🔧 RETRY INTELIGENTE: Inicializando VPS [${creationId}]`);
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= VPS_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`[Instance Manager] 🔄 TENTATIVA ${attempt}/${VPS_CONFIG.maxRetries} [${creationId}]`);
      
      // Payload detalhado e correto
      const vpsPayload = {
        instanceId: vpsInstanceId,
        sessionName: vpsInstanceId,
        webhookUrl: VPS_CONFIG.webhookUrl,
        companyId: companyId || instance.created_by_user_id,
        timeout: 120000, // 2 minutos para WhatsApp Web inicializar
        retryAttempt: attempt
      };

      console.log(`[Instance Manager] 📤 PAYLOAD DETALHADO [${creationId}] tentativa ${attempt}:`, JSON.stringify(vpsPayload, null, 2));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[Instance Manager] ⏰ TIMEOUT 30s atingido [${creationId}] tentativa ${attempt}`);
        controller.abort();
      }, VPS_CONFIG.timeout);

      // Headers detalhados
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'User-Agent': 'Supabase-WhatsApp-Instance-Manager/2.0',
        'Accept': 'application/json',
        'X-Request-ID': creationId,
        'X-Retry-Attempt': attempt.toString()
      };

      console.log(`[Instance Manager] 📤 HEADERS DETALHADOS [${creationId}]:`, JSON.stringify(headers, null, 2));

      const requestStart = Date.now();
      const response = await fetch(`${VPS_CONFIG.primaryUrl}/instance/create`, {
        method: 'POST',
        signal: controller.signal,
        headers: headers,
        body: JSON.stringify(vpsPayload)
      });

      clearTimeout(timeoutId);
      const requestTime = Date.now() - requestStart;
      
      console.log(`[Instance Manager] 📥 VPS RESPOSTA [${creationId}] tentativa ${attempt}: HTTP ${response.status} em ${requestTime}ms`);

      if (response.ok) {
        const responseText = await response.text();
        console.log(`[Instance Manager] ✅ VPS SUCESSO [${creationId}] tentativa ${attempt}: ${responseText.substring(0, 300)}`);
        
        // Sucesso - atualizar status
        await supabase
          .from('whatsapp_instances')
          .update({
            connection_status: 'waiting_qr',
            web_status: 'ready',
            updated_at: new Date().toISOString()
          })
          .eq('id', instance.id);
          
        console.log(`[Instance Manager] 🎯 INSTÂNCIA CRIADA COM SUCESSO [${creationId}]`);
        return;
        
      } else {
        const errorText = await response.text();
        lastError = `HTTP ${response.status}: ${errorText}`;
        console.error(`[Instance Manager] ❌ VPS FALHOU [${creationId}] tentativa ${attempt}: ${lastError}`);
        
        if (attempt < VPS_CONFIG.maxRetries) {
          console.log(`[Instance Manager] ⏳ Aguardando ${VPS_CONFIG.retryDelay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, VPS_CONFIG.retryDelay));
        }
      }
      
    } catch (error) {
      lastError = error.message;
      console.error(`[Instance Manager] ❌ ERRO TENTATIVA ${attempt} [${creationId}]:`, error);
      
      if (attempt < VPS_CONFIG.maxRetries) {
        console.log(`[Instance Manager] ⏳ Aguardando ${VPS_CONFIG.retryDelay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, VPS_CONFIG.retryDelay));
      }
    }
  }
  
  // Todas as tentativas falharam
  console.error(`[Instance Manager] 💥 TODAS AS ${VPS_CONFIG.maxRetries} TENTATIVAS FALHARAM [${creationId}] - Último erro:`, lastError);
  
  // Marcar como erro com detalhes
  await supabase
    .from('whatsapp_instances')
    .update({
      connection_status: 'error',
      web_status: `vps_failed_after_${VPS_CONFIG.maxRetries}_attempts: ${lastError}`,
      updated_at: new Date().toISOString()
    })
    .eq('id', instance.id);
}

// ... keep existing code (deleteInstanceCorrected, syncInstanceStatus, checkVPSStatus functions)
async function deleteInstanceCorrected(supabase: any, instanceId: string, user: any) {
  try {
    console.log(`[Instance Manager] 🗑️ DIAGNÓSTICO: Deletando:`, instanceId);

    const { data: instance, error: findError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (findError) {
      console.log(`[Instance Manager] ⚠️ Instância não encontrada no banco:`, findError.message);
      return new Response(JSON.stringify({
        success: true,
        message: 'Instância não encontrada no banco (já deletada)',
        diagnosticApplied: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Deletar da VPS se tiver vps_instance_id
    if (instance.vps_instance_id) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeout);

        // CORREÇÃO: Endpoint correto para deleção
        const deleteResponse = await fetch(`${VPS_CONFIG.primaryUrl}/instance/${instance.vps_instance_id}`, {
          method: 'DELETE',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (deleteResponse.ok) {
          console.log(`[Instance Manager] ✅ VPS deletada com sucesso`);
        } else {
          const errorText = await deleteResponse.text();
          console.log(`[Instance Manager] ⚠️ VPS respondeu com ${deleteResponse.status}:`, errorText);
        }
      } catch (vpsError) {
        console.log(`[Instance Manager] ⚠️ Erro na VPS ignorado:`, vpsError.message);
      }
    }

    // Deletar do banco sempre
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(`Erro ao deletar do banco: ${deleteError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Instância deletada com sucesso (VPS + banco)',
      diagnosticApplied: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro ao deletar:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      diagnosticApplied: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

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
          diagnosticApplied: true
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
        diagnosticApplied: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro no sync:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      diagnosticApplied: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function checkVPSStatus(supabase: any, instanceId: string, user: any) {
  try {
    console.log(`[Instance Manager] 📊 DIAGNÓSTICO: Verificando status VPS:`, instanceId);

    const vpsHealth = await diagnosticVPS();
    
    return new Response(JSON.stringify({
      success: true,
      vpsStatus: {
        online: vpsHealth.healthy,
        responseTime: `${vpsHealth.responseTime}ms`,
        error: vpsHealth.error || null,
        diagnosticApplied: true,
        details: vpsHealth
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro no check VPS:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      diagnosticApplied: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
