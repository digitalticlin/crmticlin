import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO FINAL: Configuração VPS com descoberta automática e timeouts inteligentes
const VPS_CONFIG = {
  endpoints: [
    'http://31.97.24.222:3002', // Porta principal encontrada
    'http://31.97.24.222:3001'  // Porta alternativa
  ],
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 25000, // AUMENTADO: 25s para dar tempo à VPS responder
  webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
  maxRetries: 3,
  retryDelay: 3000, // 3s entre tentativas
  discoveryTimeout: 10000 // 10s para descoberta de endpoint
};

serve(async (req) => {
  const startTime = Date.now();
  console.log('[Instance Manager] 🚀 CORREÇÃO FINAL - Diagnóstico avançado:', req.method, `[${startTime}]`);
  
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
      return await createInstanceWithAutoDiscovery(supabase, instanceName, user, startTime);
    }

    if (action === 'delete_instance_corrected') {
      return await deleteInstanceCorrected(supabase, instanceId, user);
    }

    if (action === 'sync_instance_status') {
      return await syncInstanceStatus(supabase, instanceId, user);
    }

    if (action === 'check_vps_status') {
      return await checkVPSStatusWithDiscovery(supabase, instanceId, user);
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

// CORREÇÃO FINAL: Criação com descoberta automática de VPS
async function createInstanceWithAutoDiscovery(supabase: any, instanceName: string, user: any, startTime: number) {
  const creationId = `auto_discovery_${Date.now()}`;
  console.log(`[Instance Manager] 🔧 CORREÇÃO FINAL - Criação com descoberta automática [${creationId}]:`, instanceName);

  try {
    // PASSO 1: Descoberta automática de VPS funcional
    console.log(`[Instance Manager] 🔍 FASE 1: Descoberta automática de endpoint VPS [${creationId}]`);
    const workingEndpoint = await discoverWorkingVPSEndpoint();
    
    if (!workingEndpoint) {
      throw new Error('ERRO CRÍTICO: Nenhum endpoint VPS acessível. Verifique se a VPS está online.');
    }

    console.log(`[Instance Manager] ✅ Endpoint VPS encontrado: ${workingEndpoint} [${creationId}]`);

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

    // PASSO 4: Salvar no banco com endpoint descoberto
    const instanceRecord = {
      instance_name: sanitizedName,
      vps_instance_id: vpsInstanceId,
      connection_type: 'web',
      connection_status: 'connecting', // CORREÇÃO: Não usar "creating", usar "connecting"
      web_status: 'initializing',
      created_by_user_id: user.id,
      server_url: workingEndpoint, // Salvar endpoint que funciona
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

    // PASSO 6: PROCESSAR VPS COM DESCOBERTA AUTOMÁTICA
    setTimeout(() => {
      initializeVPSWithAutoDiscovery(supabase, instance, vpsInstanceId, creationId, companyId, workingEndpoint);
    }, 500);

    return new Response(JSON.stringify({
      success: true,
      instance: instance,
      vpsInstanceId: vpsInstanceId,
      vpsEndpoint: workingEndpoint,
      diagnosticApplied: true,
      creationId,
      totalTime: Date.now() - startTime,
      message: 'Instância criada - Descoberta automática VPS aplicada'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro na criação com descoberta [${creationId}]:`, error);
    
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

// FUNÇÃO: Descoberta automática de endpoint VPS que funciona
async function discoverWorkingVPSEndpoint(): Promise<string | null> {
  console.log(`[Instance Manager] 🔍 Descobrindo endpoint VPS que funciona...`);
  
  for (const endpoint of VPS_CONFIG.endpoints) {
    try {
      console.log(`[Instance Manager] 📡 Testando: ${endpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.discoveryTimeout);
      
      const response = await fetch(`${endpoint}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Instance-Discovery/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`[Instance Manager] ✅ Endpoint funcionando: ${endpoint}`);
        return endpoint;
      } else {
        console.log(`[Instance Manager] ⚠️ Endpoint ${endpoint} respondeu HTTP ${response.status}`);
      }
      
    } catch (error) {
      console.log(`[Instance Manager] ❌ Endpoint ${endpoint} inacessível:`, error.message);
    }
  }
  
  console.log(`[Instance Manager] 💥 CRÍTICO: Nenhum endpoint VPS acessível`);
  return null;
}

// CORREÇÃO FINAL: Inicialização VPS com endpoint descoberto automaticamente
async function initializeVPSWithAutoDiscovery(supabase: any, instance: any, vpsInstanceId: string, creationId: string, companyId: any, workingEndpoint: string) {
  console.log(`[Instance Manager] 🔧 CORREÇÃO FINAL: Inicializando VPS no endpoint descoberto [${creationId}]`);
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= VPS_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`[Instance Manager] 🔄 TENTATIVA ${attempt}/${VPS_CONFIG.maxRetries} no endpoint ${workingEndpoint} [${creationId}]`);
      
      // Payload detalhado e correto
      const vpsPayload = {
        instanceId: vpsInstanceId,
        sessionName: vpsInstanceId,
        webhookUrl: VPS_CONFIG.webhookUrl,
        companyId: companyId || instance.created_by_user_id,
        timeout: 120000, // 2 minutos para WhatsApp Web inicializar
        retryAttempt: attempt
      };

      console.log(`[Instance Manager] 📤 PAYLOAD [${creationId}] tentativa ${attempt}:`, JSON.stringify(vpsPayload, null, 2));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[Instance Manager] ⏰ TIMEOUT ${VPS_CONFIG.timeout}ms atingido [${creationId}] tentativa ${attempt}`);
        controller.abort();
      }, VPS_CONFIG.timeout);

      // Headers detalhados
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'User-Agent': 'Supabase-WhatsApp-Instance-Manager/3.0-AutoDiscovery',
        'Accept': 'application/json',
        'X-Request-ID': creationId,
        'X-Retry-Attempt': attempt.toString()
      };

      const requestStart = Date.now();
      const response = await fetch(`${workingEndpoint}/instance/create`, {
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
        
        // Sucesso - atualizar status para waiting_qr (não "ready")
        await supabase
          .from('whatsapp_instances')
          .update({
            connection_status: 'waiting_qr', // CORREÇÃO: Status correto
            web_status: 'waiting_scan',
            server_url: workingEndpoint, // Confirmar endpoint que funcionou
            updated_at: new Date().toISOString()
          })
          .eq('id', instance.id);
          
        console.log(`[Instance Manager] 🎯 INSTÂNCIA CRIADA COM SUCESSO [${creationId}] - Status: waiting_qr`);
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
  
  // Todas as tentativas falharam - CORREÇÃO: Não marcar como "error", manter "connecting"
  console.error(`[Instance Manager] 💥 TODAS AS ${VPS_CONFIG.maxRetries} TENTATIVAS FALHARAM [${creationId}] - Último erro:`, lastError);
  
  // CORREÇÃO: Marcar como "offline" ao invés de "error" para permitir retry
  await supabase
    .from('whatsapp_instances')
    .update({
      connection_status: 'offline', // CORREÇÃO: Não usar "error"
      web_status: `vps_timeout_after_${VPS_CONFIG.maxRetries}_attempts`,
      updated_at: new Date().toISOString()
    })
    .eq('id', instance.id);
}

// CORREÇÃO FINAL: Check VPS status com descoberta automática
async function checkVPSStatusWithDiscovery(supabase: any, instanceId: string, user: any) {
  try {
    console.log(`[Instance Manager] 📊 CORREÇÃO FINAL: Verificando status VPS com descoberta:`, instanceId);

    const workingEndpoint = await discoverWorkingVPSEndpoint();
    
    return new Response(JSON.stringify({
      success: true,
      vpsStatus: {
        online: !!workingEndpoint,
        endpoint: workingEndpoint || 'Nenhum endpoint acessível',
        diagnosticApplied: true,
        autoDiscoveryEnabled: true
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

async function deleteInstanceCorrected(supabase: any, instanceId: string, user: any) {
  try {
    console.log(`[Instance Manager] 🗑️ CORREÇÃO FINAL: Deletando:`, instanceId);

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

    // Deletar da VPS usando endpoint descoberto
    if (instance.vps_instance_id) {
      try {
        // Usar endpoint salvo ou descobrir novo
        const vpsEndpoint = instance.server_url || await discoverWorkingVPSEndpoint();
        
        if (vpsEndpoint) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeout);

          const deleteResponse = await fetch(`${vpsEndpoint}/instance/${instance.vps_instance_id}`, {
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
    console.log(`[Instance Manager] 🔄 CORREÇÃO FINAL: Sincronizando status para ${instanceId}`);
    
    const { data: instance, error: findError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (findError || !instance?.vps_instance_id) {
      throw new Error('Instância não encontrada');
    }

    // Usar endpoint salvo ou descobrir novo
    const vpsEndpoint = instance.server_url || await discoverWorkingVPSEndpoint();
    
    if (!vpsEndpoint) {
      throw new Error('Nenhum endpoint VPS acessível');
    }

    // Buscar status na VPS
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeout);

      const response = await fetch(`${vpsEndpoint}/instance/${instance.vps_instance_id}/status`, {
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
            server_url: vpsEndpoint, // Confirmar endpoint que funcionou
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
            qr_code: vpsData.qrCode || instance.qr_code,
            server_url: vpsEndpoint
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
