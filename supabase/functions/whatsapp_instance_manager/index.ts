
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CONFIGURAÇÃO ROBUSTA COM RETRY E HEALTH CHECK
const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 30000, // Reduzido para 30s
  retryAttempts: 2, // Reduzido para 2 tentativas
  backoffMultiplier: 1000 // Reduzido delay
};

interface LogEntry {
  timestamp: string;
  phase: string;
  action: string;
  duration?: number;
  status: 'start' | 'success' | 'error' | 'warning';
  data?: any;
}

function logStructured(entry: LogEntry) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${entry.phase}] ${entry.action} - ${entry.status}${entry.duration ? ` (${entry.duration}ms)` : ''}`;
  console.log(logLine, entry.data ? JSON.stringify(entry.data) : '');
}

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkVPSHealth(): Promise<{ healthy: boolean; latency: number; error?: string }> {
  const startTime = Date.now();
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'VPS_HEALTH',
    action: 'Starting VPS health check',
    status: 'start'
  });

  try {
    // DEBUG: Log detalhado da requisição
    console.log('[DEBUG] Iniciando fetch para health check');
    console.log('[DEBUG] URL:', `${VPS_CONFIG.baseUrl}/health`);
    console.log('[DEBUG] Headers:', {
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
      'Content-Type': 'application/json'
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[DEBUG] AbortController disparado após 10s');
      controller.abort();
    }, 10000);

    console.log('[DEBUG] Fazendo fetch...');
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    
    console.log('[DEBUG] Fetch completado!');
    console.log('[DEBUG] Status:', response.status);
    console.log('[DEBUG] Status Text:', response.statusText);

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'VPS_HEALTH',
      action: 'VPS response received',
      status: 'success',
      duration: latency,
      data: { 
        status: response.status, 
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      }
    });

    if (response.ok) {
      return { healthy: true, latency };
    } else {
      return { healthy: false, latency, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    
    console.log('[DEBUG] Erro no fetch:', error);
    console.log('[DEBUG] Tipo do erro:', error.name);
    console.log('[DEBUG] Mensagem:', error.message);
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'VPS_HEALTH',
      action: 'VPS health check failed',
      status: 'error',
      duration: latency,
      data: { 
        error: error.message,
        name: error.name,
        cause: error.cause
      }
    });
    
    return { healthy: false, latency, error: error.message };
  }
}

async function makeVPSRequestWithRetry(endpoint: string, method: string, payload: any, attemptNumber = 1): Promise<any> {
  const startTime = Date.now();
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'VPS_REQUEST',
    action: `Attempt ${attemptNumber}/${VPS_CONFIG.retryAttempts} - ${method} ${endpoint}`,
    status: 'start',
    data: { payload, attempt: attemptNumber }
  });

  try {
    // DEBUG: Log detalhado da requisição principal
    const fullUrl = `${VPS_CONFIG.baseUrl}${endpoint}`;
    console.log('[DEBUG] === REQUISIÇÃO VPS ===');
    console.log('[DEBUG] URL completa:', fullUrl);
    console.log('[DEBUG] Método:', method);
    console.log('[DEBUG] Payload:', JSON.stringify(payload));
    console.log('[DEBUG] Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
      'User-Agent': 'Supabase-Edge-Function/1.0'
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[DEBUG] Timeout de ${VPS_CONFIG.timeout}ms atingido, abortando requisição`);
      controller.abort();
    }, VPS_CONFIG.timeout);

    console.log('[DEBUG] Iniciando fetch principal...');
    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'User-Agent': 'Supabase-Edge-Function/1.0'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log('[DEBUG] Fetch principal completado!');
    console.log('[DEBUG] Status da resposta:', response.status);
    console.log('[DEBUG] Status text:', response.statusText);
    console.log('[DEBUG] Content-Type:', response.headers.get('content-type'));

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'VPS_REQUEST',
      action: 'VPS response received',
      status: 'success',
      duration,
      data: { 
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[DEBUG] Resposta de erro:', errorText);
      
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'VPS_REQUEST',
        action: `VPS returned error ${response.status}`,
        status: 'error',
        duration,
        data: { status: response.status, error: errorText, statusText: response.statusText }
      });
      
      throw new Error(`VPS HTTP Error ${response.status}: ${response.statusText} - ${errorText}`);
    }

    console.log('[DEBUG] Fazendo parse do JSON...');
    const data = await response.json();
    console.log('[DEBUG] JSON parseado:', JSON.stringify(data));
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'VPS_REQUEST',
      action: 'VPS request successful',
      status: 'success',
      duration,
      data: { success: data.success, instanceId: data.instanceId }
    });

    return data;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log('[DEBUG] === ERRO NA REQUISIÇÃO VPS ===');
    console.log('[DEBUG] Tipo do erro:', error.name);
    console.log('[DEBUG] Mensagem:', error.message);
    console.log('[DEBUG] Stack:', error.stack);
    console.log('[DEBUG] Duração até erro:', duration, 'ms');
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'VPS_REQUEST',
      action: `Attempt ${attemptNumber} failed`,
      status: 'error',
      duration,
      data: { 
        error: error.message, 
        name: error.name,
        isAborted: error.name === 'AbortError',
        isTimeout: error.message.includes('timeout') || error.name === 'AbortError'
      }
    });

    // CORREÇÃO: Retry logic mais inteligente
    if (attemptNumber < VPS_CONFIG.retryAttempts) {
      const backoffDelay = VPS_CONFIG.backoffMultiplier * attemptNumber;
      
      console.log(`[DEBUG] Tentando novamente em ${backoffDelay}ms...`);
      
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'RETRY_LOGIC',
        action: `Waiting ${backoffDelay}ms before retry ${attemptNumber + 1}`,
        status: 'warning'
      });

      await wait(backoffDelay);
      return makeVPSRequestWithRetry(endpoint, method, payload, attemptNumber + 1);
    }

    // CORREÇÃO: Melhor classificação de erros
    if (error.name === 'AbortError') {
      throw new Error(`VPS Timeout após ${VPS_CONFIG.timeout}ms - servidor pode estar sobrecarregado`);
    }

    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const operationId = `op_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  console.log('[DEBUG] === NOVA OPERAÇÃO INICIADA ===');
  console.log('[DEBUG] Operation ID:', operationId);
  console.log('[DEBUG] Método HTTP:', req.method);
  console.log('[DEBUG] URL:', req.url);
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'OPERATION_START',
    action: `Operation ${operationId} started`,
    status: 'start',
    data: { method: req.method, url: req.url }
  });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[DEBUG] Cliente Supabase criado');

    // CORREÇÃO: Autenticação mais robusta
    const authHeader = req.headers.get('Authorization');
    let currentUser = null;
    
    console.log('[DEBUG] Auth header presente:', !!authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'AUTHENTICATION',
        action: 'Validating JWT token',
        status: 'start'
      });
      
      try {
        console.log('[DEBUG] Validando token JWT...');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError) {
          console.log('[DEBUG] Erro na validação:', userError);
          logStructured({
            timestamp: new Date().toISOString(),
            phase: 'AUTHENTICATION',
            action: 'JWT validation failed',
            status: 'error',
            data: { error: userError.message, code: userError.code }
          });
        } else if (user) {
          currentUser = user;
          console.log('[DEBUG] Usuário autenticado:', user.id, user.email);
          logStructured({
            timestamp: new Date().toISOString(),
            phase: 'AUTHENTICATION',
            action: 'User authenticated successfully',
            status: 'success',
            data: { userId: user.id, email: user.email }
          });
        }
      } catch (authError) {
        console.log('[DEBUG] Exceção na autenticação:', authError);
        logStructured({
          timestamp: new Date().toISOString(),
          phase: 'AUTHENTICATION',
          action: 'Authentication failed',
          status: 'error',
          data: { error: authError.message }
        });
      }
    }

    if (!currentUser) {
      console.log('[DEBUG] Usuário não autenticado, retornando 401');
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'OPERATION_END',
        action: `Operation ${operationId} failed - no authentication`,
        status: 'error'
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuário não autenticado - token obrigatório',
        operationId
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[DEBUG] Fazendo parse do body...');
    const { action, instanceName, instanceId } = await req.json();
    
    console.log('[DEBUG] Body parseado:', { action, instanceName, instanceId });
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'REQUEST_PARSING',
      action: `Action received: ${action}`,
      status: 'success',
      data: { action, instanceName, instanceId, userId: currentUser.id }
    });

    if (action === 'create_instance') {
      console.log('[DEBUG] Redirecionando para createInstanceRobust');
      return await createInstanceRobust(supabase, instanceName, currentUser, operationId);
    }

    if (action === 'delete_instance_corrected') {
      console.log('[DEBUG] Redirecionando para deleteInstanceRobust');
      return await deleteInstanceRobust(supabase, instanceId, currentUser, operationId);
    }

    console.log('[DEBUG] Ação desconhecida:', action);
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `Operation ${operationId} failed - unknown action`,
      status: 'error',
      data: { action }
    });

    return new Response(JSON.stringify({
      success: false,
      error: 'Ação não reconhecida: ' + action,
      operationId
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log('[DEBUG] === ERRO GERAL NA EDGE FUNCTION ===');
    console.log('[DEBUG] Erro:', error);
    console.log('[DEBUG] Stack:', error.stack);
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `Operation ${operationId} failed with error`,
      status: 'error',
      data: { error: error.message, stack: error.stack }
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      operationId,
      details: 'Erro na Edge Function robusta'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function createInstanceRobust(supabase: any, instanceName: string, user: any, operationId: string) {
  console.log('[DEBUG] === CRIAR INSTÂNCIA ROBUSTO ===');
  console.log('[DEBUG] Instance Name:', instanceName);
  console.log('[DEBUG] User ID:', user.id);
  console.log('[DEBUG] Operation ID:', operationId);
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'CREATE_INSTANCE',
    action: `Starting robust instance creation for ${instanceName}`,
    status: 'start',
    data: { instanceName, userId: user.id, operationId }
  });

  try {
    if (!instanceName || instanceName.trim().length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const normalizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    
    console.log('[DEBUG] Nome normalizado:', normalizedName);
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE',
      action: 'Instance name normalized',
      status: 'success',
      data: { original: instanceName, normalized: normalizedName }
    });

    // FASE 1: Health check da VPS
    console.log('[DEBUG] === FASE 1: HEALTH CHECK ===');
    const healthCheck = await checkVPSHealth();
    
    console.log('[DEBUG] Resultado do health check:', healthCheck);
    
    if (!healthCheck.healthy) {
      console.log('[DEBUG] VPS não está saudável, abortando criação');
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'CREATE_INSTANCE',
        action: 'VPS health check failed - aborting creation',
        status: 'error',
        data: { healthCheck }
      });
      
      throw new Error(`VPS não está saudável: ${healthCheck.error} (latência: ${healthCheck.latency}ms)`);
    }

    console.log('[DEBUG] VPS saudável, prosseguindo...');

    // FASE 2: Comunicação com VPS
    console.log('[DEBUG] === FASE 2: COMUNICAÇÃO VPS ===');
    const vpsPayload = {
      instanceId: normalizedName,
      sessionName: normalizedName,
      webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
    };

    console.log('[DEBUG] Payload para VPS:', vpsPayload);

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE',
      action: 'Sending create request to VPS with retry logic',
      status: 'start',
      data: { payload: vpsPayload }
    });

    const vpsData = await makeVPSRequestWithRetry('/instance/create', 'POST', vpsPayload);

    console.log('[DEBUG] Resposta da VPS:', vpsData);

    if (!vpsData.success) {
      throw new Error(vpsData.error || 'VPS retornou success: false');
    }

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE',
      action: 'VPS instance creation successful',
      status: 'success',
      data: { vpsInstanceId: vpsData.instanceId }
    });

    // FASE 3: Salvar no Supabase
    console.log('[DEBUG] === FASE 3: SALVAR NO SUPABASE ===');
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE',
      action: 'Saving instance to Supabase',
      status: 'start'
    });

    const instanceData = {
      instance_name: normalizedName,
      connection_type: 'web',
      server_url: VPS_CONFIG.baseUrl,
      vps_instance_id: vpsData.instanceId || normalizedName,
      web_status: 'initializing',
      connection_status: 'vps_created',
      created_by_user_id: user.id,
      company_id: null
    };
    
    console.log('[DEBUG] Dados para inserir no Supabase:', instanceData);

    const { data: newInstance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceData)
      .select()
      .single();

    if (dbError) {
      console.log('[DEBUG] Erro no banco:', dbError);
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'CREATE_INSTANCE',
        action: 'Database save failed',
        status: 'error',
        data: { error: dbError.message }
      });
      throw new Error(`Erro ao salvar instância no banco: ${dbError.message}`);
    }

    console.log('[DEBUG] Instância salva no banco:', newInstance);

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `Operation ${operationId} completed successfully`,
      status: 'success',
      data: { 
        instanceId: newInstance.id, 
        instanceName: newInstance.instance_name
      }
    });

    console.log('[DEBUG] === SUCESSO COMPLETO ===');
    console.log('[DEBUG] Nova instância criada:', newInstance.id);

    return new Response(JSON.stringify({
      success: true,
      instance: newInstance,
      vps_response: vpsData,
      user_id: user.id,
      operationId,
      vps_health: healthCheck,
      message: 'Instância criada com sistema robusto e logs detalhados'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log('[DEBUG] === ERRO NA CRIAÇÃO ===');
    console.log('[DEBUG] Erro:', error);
    console.log('[DEBUG] Stack:', error.stack);
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `Operation ${operationId} failed during creation`,
      status: 'error',
      data: { error: error.message }
    });
    
    let errorMessage = error.message;
    let errorType = 'UNKNOWN_ERROR';
    
    if (error.name === 'AbortError' || error.message.includes('Timeout')) {
      errorMessage = 'Timeout na comunicação com VPS - sistema sobrecarregado';
      errorType = 'VPS_TIMEOUT';
    } else if (error.message.includes('HTTP')) {
      errorType = 'VPS_HTTP_ERROR';
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      errorType,
      operationId,
      action: 'create_instance',
      instanceName: instanceName,
      method: 'robust_edge_function_with_detailed_logs'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function deleteInstanceRobust(supabase: any, instanceId: string, user: any, operationId: string) {
  console.log('[DEBUG] === DELETAR INSTÂNCIA ROBUSTO ===');
  console.log('[DEBUG] Instance ID:', instanceId);
  console.log('[DEBUG] User ID:', user.id);
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'DELETE_INSTANCE',
    action: `Starting robust instance deletion for ${instanceId}`,
    status: 'start',
    data: { instanceId, userId: user.id, operationId }
  });
  
  try {
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (fetchError) {
      throw new Error('Instância não encontrada: ' + fetchError.message);
    }

    console.log('[DEBUG] Instância encontrada:', instance);

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'DELETE_INSTANCE',
      action: 'Instance found in database',
      status: 'success',
      data: { instanceName: instance.instance_name, vpsInstanceId: instance.vps_instance_id }
    });

    // Deletar da VPS se tiver vps_instance_id
    if (instance.vps_instance_id) {
      try {
        console.log('[DEBUG] Deletando da VPS:', instance.vps_instance_id);
        
        logStructured({
          timestamp: new Date().toISOString(),
          phase: 'DELETE_INSTANCE',
          action: 'Deleting from VPS with retry logic',
          status: 'start'
        });
        
        await makeVPSRequestWithRetry(`/instance/${instance.vps_instance_id}`, 'DELETE', {});
        
        console.log('[DEBUG] Deletado da VPS com sucesso');
        
        logStructured({
          timestamp: new Date().toISOString(),
          phase: 'DELETE_INSTANCE',
          action: 'VPS deletion successful',
          status: 'success'
        });
      } catch (vpsError) {
        console.log('[DEBUG] Erro ao deletar da VPS (continuando):', vpsError);
        logStructured({
          timestamp: new Date().toISOString(),
          phase: 'DELETE_INSTANCE',
          action: 'VPS deletion failed but continuing',
          status: 'warning',
          data: { error: vpsError.message }
        });
      }
    }

    // Deletar do banco
    console.log('[DEBUG] Deletando do banco...');
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(`Erro ao deletar instância do banco: ${deleteError.message}`);
    }

    console.log('[DEBUG] Deletado do banco com sucesso');

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `Operation ${operationId} deletion completed successfully`,
      status: 'success'
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Instância deletada com sistema robusto',
      operationId,
      user_id: user?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log('[DEBUG] === ERRO NA DELEÇÃO ===');
    console.log('[DEBUG] Erro:', error);
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `Operation ${operationId} deletion failed`,
      status: 'error',
      data: { error: error.message }
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      operationId,
      action: 'delete_instance',
      instanceId: instanceId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
