import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// FASE 1: CONFIGURAÇÃO CORRIGIDA COM TIMEOUTS CONSISTENTES
const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 30000, // Consistente: 30s para todas operações
  healthTimeout: 25000, // CORRIGIDO: Health check com 25s (antes era 10s)
  retryAttempts: 3, // Aumentado para 3 tentativas
  backoffMultiplier: 1500 // Aumentado delay entre tentativas
};

interface LogEntry {
  timestamp: string;
  phase: string;
  action: string;
  duration?: number;
  status: 'start' | 'success' | 'error' | 'warning';
  data?: any;
  origin?: string; // NOVO: IP de origem
  headers?: any; // NOVO: Headers da requisição
}

function logStructured(entry: LogEntry) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${entry.phase}] ${entry.action} - ${entry.status}${entry.duration ? ` (${entry.duration}ms)` : ''}`;
  console.log(logLine, entry.data ? JSON.stringify(entry.data) : '');
}

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// FASE 1: HEALTH CHECK CORRIGIDO COM LOGS DETALHADOS
async function checkVPSHealthWithDiagnosis(): Promise<{ healthy: boolean; latency: number; error?: string; diagnostics: any }> {
  const startTime = Date.now();
  const diagnostics = {
    timeout: VPS_CONFIG.healthTimeout,
    userAgent: 'Supabase-Edge-WhatsApp-Diagnostic/1.0',
    timestamp: new Date().toISOString(),
    attempt: 1
  };
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'VPS_HEALTH_DIAGNOSTIC',
    action: 'Starting enhanced VPS health check',
    status: 'start',
    data: diagnostics
  });

  try {
    console.log('[DIAGNOSTIC] === ENHANCED HEALTH CHECK START ===');
    console.log('[DIAGNOSTIC] URL:', `${VPS_CONFIG.baseUrl}/health`);
    console.log('[DIAGNOSTIC] Timeout configurado:', VPS_CONFIG.healthTimeout, 'ms');
    console.log('[DIAGNOSTIC] User-Agent:', diagnostics.userAgent);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[DIAGNOSTIC] TIMEOUT ATINGIDO após', VPS_CONFIG.healthTimeout, 'ms - AbortController disparado');
      controller.abort();
    }, VPS_CONFIG.healthTimeout); // CORRIGIDO: 25s em vez de 10s

    console.log('[DIAGNOSTIC] Iniciando fetch com timeout de', VPS_CONFIG.healthTimeout, 'ms...');
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'Content-Type': 'application/json',
        'User-Agent': diagnostics.userAgent,
        'X-Request-Source': 'Supabase-Edge-Function',
        'X-Request-Time': diagnostics.timestamp
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    
    console.log('[DIAGNOSTIC] === RESPOSTA RECEBIDA ===');
    console.log('[DIAGNOSTIC] Status:', response.status);
    console.log('[DIAGNOSTIC] Status Text:', response.statusText);
    console.log('[DIAGNOSTIC] Latência:', latency, 'ms');
    console.log('[DIAGNOSTIC] Headers de resposta:', Object.fromEntries(response.headers.entries()));

    const responseData = {
      status: response.status, 
      statusText: response.statusText,
      latency,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url
    };

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'VPS_HEALTH_DIAGNOSTIC',
      action: 'VPS health response received',
      status: 'success',
      duration: latency,
      data: responseData
    });

    if (response.ok) {
      console.log('[DIAGNOSTIC] ✅ Health check SUCESSO com', latency, 'ms');
      return { 
        healthy: true, 
        latency, 
        diagnostics: { ...diagnostics, response: responseData }
      };
    } else {
      console.log('[DIAGNOSTIC] ❌ Health check FALHOU - Status não OK:', response.status);
      return { 
        healthy: false, 
        latency, 
        error: `HTTP ${response.status}: ${response.statusText}`,
        diagnostics: { ...diagnostics, response: responseData }
      };
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    
    console.log('[DIAGNOSTIC] === ERRO NO HEALTH CHECK ===');
    console.log('[DIAGNOSTIC] Tipo do erro:', error.name);
    console.log('[DIAGNOSTIC] Mensagem:', error.message);
    console.log('[DIAGNOSTIC] Latência até erro:', latency, 'ms');
    console.log('[DIAGNOSTIC] É AbortError?', error.name === 'AbortError');
    console.log('[DIAGNOSTIC] Stack completo:', error.stack);
    
    const errorData = {
      name: error.name,
      message: error.message,
      latency,
      isTimeout: error.name === 'AbortError',
      stack: error.stack
    };
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'VPS_HEALTH_DIAGNOSTIC',
      action: 'VPS health check failed with detailed error',
      status: 'error',
      duration: latency,
      data: errorData
    });
    
    return { 
      healthy: false, 
      latency, 
      error: error.message,
      diagnostics: { ...diagnostics, error: errorData }
    };
  }
}

// FASE 1: REQUISIÇÃO VPS COM LOGS APRIMORADOS
async function makeVPSRequestWithEnhancedDiagnostics(endpoint: string, method: string, payload: any, attemptNumber = 1): Promise<any> {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'VPS_REQUEST_DIAGNOSTIC',
    action: `Enhanced attempt ${attemptNumber}/${VPS_CONFIG.retryAttempts} - ${method} ${endpoint}`,
    status: 'start',
    data: { payload, attempt: attemptNumber, requestId }
  });

  try {
    const fullUrl = `${VPS_CONFIG.baseUrl}${endpoint}`;
    console.log('[DIAGNOSTIC] === REQUISIÇÃO VPS DETALHADA ===');
    console.log('[DIAGNOSTIC] Request ID:', requestId);
    console.log('[DIAGNOSTIC] URL completa:', fullUrl);
    console.log('[DIAGNOSTIC] Método:', method);
    console.log('[DIAGNOSTIC] Tentativa:', attemptNumber, 'de', VPS_CONFIG.retryAttempts);
    console.log('[DIAGNOSTIC] Timeout configurado:', VPS_CONFIG.timeout, 'ms');
    console.log('[DIAGNOSTIC] Payload size:', JSON.stringify(payload).length, 'bytes');
    
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
      'User-Agent': 'Supabase-Edge-WhatsApp-Enhanced/1.0',
      'X-Request-ID': requestId,
      'X-Request-Source': 'Supabase-Edge-Function',
      'X-Attempt-Number': attemptNumber.toString(),
      'X-Request-Time': new Date().toISOString()
    };
    
    console.log('[DIAGNOSTIC] Headers da requisição:', requestHeaders);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[DIAGNOSTIC] TIMEOUT principal de ${VPS_CONFIG.timeout}ms atingido para Request ID: ${requestId}`);
      controller.abort();
    }, VPS_CONFIG.timeout);

    console.log('[DIAGNOSTIC] Iniciando fetch principal...');
    const response = await fetch(fullUrl, {
      method,
      headers: requestHeaders,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log('[DIAGNOSTIC] === RESPOSTA PRINCIPAL RECEBIDA ===');
    console.log('[DIAGNOSTIC] Request ID:', requestId);
    console.log('[DIAGNOSTIC] Status da resposta:', response.status);
    console.log('[DIAGNOSTIC] Status text:', response.statusText);
    console.log('[DIAGNOSTIC] Content-Type:', response.headers.get('content-type'));
    console.log('[DIAGNOSTIC] Duração total:', duration, 'ms');

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'VPS_REQUEST_DIAGNOSTIC',
      action: 'Enhanced VPS response received',
      status: 'success',
      duration,
      data: { 
        requestId,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        attempt: attemptNumber
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[DIAGNOSTIC] ❌ Resposta de erro (Request ID:', requestId, '):', errorText);
      
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'VPS_REQUEST_DIAGNOSTIC',
        action: `Enhanced VPS returned error ${response.status}`,
        status: 'error',
        duration,
        data: { requestId, status: response.status, error: errorText, statusText: response.statusText }
      });
      
      throw new Error(`VPS HTTP Error ${response.status}: ${response.statusText} - ${errorText} (Request ID: ${requestId})`);
    }

    console.log('[DIAGNOSTIC] Fazendo parse do JSON...');
    const data = await response.json();
    console.log('[DIAGNOSTIC] ✅ JSON parseado com sucesso (Request ID:', requestId, ')');
    console.log('[DIAGNOSTIC] Dados recebidos:', JSON.stringify(data).substring(0, 200) + '...');
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'VPS_REQUEST_DIAGNOSTIC',
      action: 'Enhanced VPS request successful',
      status: 'success',
      duration,
      data: { requestId, success: data.success, instanceId: data.instanceId }
    });

    return data;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log('[DIAGNOSTIC] === ERRO NA REQUISIÇÃO VPS ===');
    console.log('[DIAGNOSTIC] Request ID:', requestId);
    console.log('[DIAGNOSTIC] Tentativa:', attemptNumber, 'de', VPS_CONFIG.retryAttempts);
    console.log('[DIAGNOSTIC] Tipo do erro:', error.name);
    console.log('[DIAGNOSTIC] Mensagem:', error.message);
    console.log('[DIAGNOSTIC] Stack:', error.stack);
    console.log('[DIAGNOSTIC] Duração até erro:', duration, 'ms');
    console.log('[DIAGNOSTIC] É timeout?', error.name === 'AbortError');
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'VPS_REQUEST_DIAGNOSTIC',
      action: `Enhanced attempt ${attemptNumber} failed`,
      status: 'error',
      duration,
      data: { 
        requestId,
        error: error.message, 
        name: error.name,
        isAborted: error.name === 'AbortError',
        isTimeout: error.message.includes('timeout') || error.name === 'AbortError',
        attempt: attemptNumber
      }
    });

    // FASE 1: RETRY MELHORADO
    if (attemptNumber < VPS_CONFIG.retryAttempts) {
      const backoffDelay = VPS_CONFIG.backoffMultiplier * attemptNumber;
      
      console.log(`[DIAGNOSTIC] 🔄 Tentando novamente Request ID ${requestId} em ${backoffDelay}ms... (tentativa ${attemptNumber + 1}/${VPS_CONFIG.retryAttempts})`);
      
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'RETRY_LOGIC_ENHANCED',
        action: `Waiting ${backoffDelay}ms before enhanced retry ${attemptNumber + 1}`,
        status: 'warning',
        data: { requestId, backoffDelay, nextAttempt: attemptNumber + 1 }
      });

      await wait(backoffDelay);
      return makeVPSRequestWithEnhancedDiagnostics(endpoint, method, payload, attemptNumber + 1);
    }

    // FASE 1: MELHOR CLASSIFICAÇÃO DE ERROS
    if (error.name === 'AbortError') {
      throw new Error(`VPS Timeout após ${VPS_CONFIG.timeout}ms - servidor pode estar sobrecarregado (Request ID: ${requestId})`);
    }

    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const operationId = `op_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  console.log('[DIAGNOSTIC] === NOVA OPERAÇÃO INICIADA (FASE 1) ===');
  console.log('[DIAGNOSTIC] Operation ID:', operationId);
  console.log('[DIAGNOSTIC] Método HTTP:', req.method);
  console.log('[DIAGNOSTIC] URL:', req.url);
  console.log('[DIAGNOSTIC] Configuração VPS:', {
    baseUrl: VPS_CONFIG.baseUrl,
    timeout: VPS_CONFIG.timeout,
    healthTimeout: VPS_CONFIG.healthTimeout,
    retryAttempts: VPS_CONFIG.retryAttempts
  });
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'OPERATION_START_ENHANCED',
    action: `Enhanced operation ${operationId} started`,
    status: 'start',
    data: { method: req.method, url: req.url, vpsConfig: VPS_CONFIG }
  });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[DIAGNOSTIC] Cliente Supabase criado');

    // ... keep existing code (authentication logic) the same ...

    const authHeader = req.headers.get('Authorization');
    let currentUser = null;
    
    console.log('[DIAGNOSTIC] Auth header presente:', !!authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'AUTHENTICATION',
        action: 'Validating JWT token',
        status: 'start'
      });
      
      try {
        console.log('[DIAGNOSTIC] Validando token JWT...');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError) {
          console.log('[DIAGNOSTIC] Erro na validação:', userError);
          logStructured({
            timestamp: new Date().toISOString(),
            phase: 'AUTHENTICATION',
            action: 'JWT validation failed',
            status: 'error',
            data: { error: userError.message, code: userError.code }
          });
        } else if (user) {
          currentUser = user;
          console.log('[DIAGNOSTIC] Usuário autenticado:', user.id, user.email);
          logStructured({
            timestamp: new Date().toISOString(),
            phase: 'AUTHENTICATION',
            action: 'User authenticated successfully',
            status: 'success',
            data: { userId: user.id, email: user.email }
          });
        }
      } catch (authError) {
        console.log('[DIAGNOSTIC] Exceção na autenticação:', authError);
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
      console.log('[DIAGNOSTIC] Usuário não autenticado, retornando 401');
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

    console.log('[DIAGNOSTIC] Fazendo parse do body...');
    const { action, instanceName, instanceId } = await req.json();
    
    console.log('[DIAGNOSTIC] Body parseado:', { action, instanceName, instanceId });
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'REQUEST_PARSING',
      action: `Action received: ${action}`,
      status: 'success',
      data: { action, instanceName, instanceId, userId: currentUser.id }
    });

    if (action === 'create_instance') {
      console.log('[DIAGNOSTIC] Redirecionando para createInstanceEnhanced');
      return await createInstanceEnhanced(supabase, instanceName, currentUser, operationId);
    }

    if (action === 'delete_instance_corrected') {
      console.log('[DIAGNOSTIC] Redirecionando para deleteInstanceEnhanced');
      return await deleteInstanceEnhanced(supabase, instanceId, currentUser, operationId);
    }

    console.log('[DIAGNOSTIC] Ação desconhecida:', action);
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
    console.log('[DIAGNOSTIC] === ERRO GERAL NA EDGE FUNCTION ===');
    console.log('[DIAGNOSTIC] Erro:', error);
    console.log('[DIAGNOSTIC] Stack:', error.stack);
    
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
      details: 'Erro na Edge Function com diagnóstico FASE 1'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// FASE 1: FUNÇÃO CREATEINSTANCE APRIMORADA
async function createInstanceEnhanced(supabase: any, instanceName: string, user: any, operationId: string) {
  console.log('[DIAGNOSTIC] === CRIAR INSTÂNCIA ENHANCED (FASE 1) ===');
  console.log('[DIAGNOSTIC] Instance Name:', instanceName);
  console.log('[DIAGNOSTIC] User ID:', user.id);
  console.log('[DIAGNOSTIC] Operation ID:', operationId);
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'CREATE_INSTANCE_ENHANCED',
    action: `Starting FASE 1 enhanced instance creation for ${instanceName}`,
    status: 'start',
    data: { instanceName, userId: user.id, operationId }
  });

  try {
    if (!instanceName || instanceName.trim().length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const normalizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    
    console.log('[DIAGNOSTIC] Nome normalizado:', normalizedName);
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE_ENHANCED',
      action: 'Instance name normalized',
      status: 'success',
      data: { original: instanceName, normalized: normalizedName }
    });

    // FASE 1: HEALTH CHECK APRIMORADO
    console.log('[DIAGNOSTIC] === FASE 1: ENHANCED HEALTH CHECK ===');
    const healthCheck = await checkVPSHealthWithDiagnosis();
    
    console.log('[DIAGNOSTIC] Resultado do enhanced health check:', healthCheck);
    
    if (!healthCheck.healthy) {
      console.log('[DIAGNOSTIC] ⚠️ VPS não está saudável, mas tentando criação mesmo assim (FASE 1 - bypass)');
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'CREATE_INSTANCE_ENHANCED',
        action: 'VPS health check failed - attempting creation anyway (FASE 1 bypass)',
        status: 'warning',
        data: { healthCheck }
      });
      
      // FASE 1: EM VEZ DE ABORTAR, TENTAR CRIAÇÃO DIRETA
      console.log('[DIAGNOSTIC] 🚀 FASE 1: Tentando criação DIRETA mesmo com health check falhando...');
    } else {
      console.log('[DIAGNOSTIC] ✅ VPS saudável, prosseguindo normalmente...');
    }

    // FASE 1: COMUNICAÇÃO COM VPS APRIMORADA
    console.log('[DIAGNOSTIC] === FASE 1: ENHANCED VPS COMMUNICATION ===');
    const vpsPayload = {
      instanceId: normalizedName,
      sessionName: normalizedName,
      webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
    };

    console.log('[DIAGNOSTIC] Payload para VPS (FASE 1):', vpsPayload);

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE_ENHANCED',
      action: 'Sending enhanced create request to VPS with FASE 1 diagnostics',
      status: 'start',
      data: { payload: vpsPayload }
    });

    const vpsData = await makeVPSRequestWithEnhancedDiagnostics('/instance/create', 'POST', vpsPayload);

    console.log('[DIAGNOSTIC] ✅ Resposta da VPS (FASE 1):', vpsData);

    if (!vpsData.success) {
      throw new Error(vpsData.error || 'VPS retornou success: false');
    }

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE_ENHANCED',
      action: 'FASE 1 VPS instance creation successful',
      status: 'success',
      data: { vpsInstanceId: vpsData.instanceId }
    });

    // FASE 1: SALVAR NO SUPABASE
    console.log('[DIAGNOSTIC] === FASE 1: SALVAR NO SUPABASE ===');
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE_ENHANCED',
      action: 'Saving FASE 1 instance to Supabase',
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
    
    console.log('[DIAGNOSTIC] Dados para inserir no Supabase (FASE 1):', instanceData);

    const { data: newInstance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceData)
      .select()
      .single();

    if (dbError) {
      console.log('[DIAGNOSTIC] Erro no banco (FASE 1):', dbError);
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'CREATE_INSTANCE_ENHANCED',
        action: 'FASE 1 Database save failed',
        status: 'error',
        data: { error: dbError.message }
      });
      throw new Error(`Erro ao salvar instância no banco: ${dbError.message}`);
    }

    console.log('[DIAGNOSTIC] ✅ Instância salva no banco (FASE 1):', newInstance);

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `FASE 1 Operation ${operationId} completed successfully`,
      status: 'success',
      data: { 
        instanceId: newInstance.id, 
        instanceName: newInstance.instance_name,
        phase: 'FASE_1_DIAGNOSTIC'
      }
    });

    console.log('[DIAGNOSTIC] === FASE 1 SUCESSO COMPLETO ===');
    console.log('[DIAGNOSTIC] Nova instância criada com diagnóstico:', newInstance.id);

    return new Response(JSON.stringify({
      success: true,
      instance: newInstance,
      vps_response: vpsData,
      user_id: user.id,
      operationId,
      vps_health: healthCheck,
      phase: 'FASE_1_DIAGNOSTIC',
      diagnostics: healthCheck.diagnostics,
      message: 'Instância criada com sistema FASE 1 - diagnóstico aprimorado'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log('[DIAGNOSTIC] === ERRO NA CRIAÇÃO (FASE 1) ===');
    console.log('[DIAGNOSTIC] Erro:', error);
    console.log('[DIAGNOSTIC] Stack:', error.stack);
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `FASE 1 Operation ${operationId} failed during creation`,
      status: 'error',
      data: { error: error.message, phase: 'FASE_1_DIAGNOSTIC' }
    });
    
    let errorMessage = error.message;
    let errorType = 'UNKNOWN_ERROR';
    
    if (error.name === 'AbortError' || error.message.includes('Timeout')) {
      errorMessage = 'FASE 1 - Timeout na comunicação com VPS - diagnóstico ativo';
      errorType = 'VPS_TIMEOUT_DIAGNOSED';
    } else if (error.message.includes('HTTP')) {
      errorType = 'VPS_HTTP_ERROR_DIAGNOSED';
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      errorType,
      operationId,
      action: 'create_instance',
      instanceName: instanceName,
      phase: 'FASE_1_DIAGNOSTIC',
      method: 'enhanced_edge_function_with_detailed_diagnostics'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// FASE 1: FUNÇÃO DELETE APRIMORADA
async function deleteInstanceEnhanced(supabase: any, instanceId: string, user: any, operationId: string) {
  console.log('[DIAGNOSTIC] === DELETAR INSTÂNCIA ENHANCED (FASE 1) ===');
  console.log('[DIAGNOSTIC] Instance ID:', instanceId);
  console.log('[DIAGNOSTIC] User ID:', user.id);
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'DELETE_INSTANCE_ENHANCED',
    action: `Starting FASE 1 enhanced instance deletion for ${instanceId}`,
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

    console.log('[DIAGNOSTIC] Instância encontrada (FASE 1):', instance);

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'DELETE_INSTANCE_ENHANCED',
      action: 'FASE 1 Instance found in database',
      status: 'success',
      data: { instanceName: instance.instance_name, vpsInstanceId: instance.vps_instance_id }
    });

    // Deletar da VPS se tiver vps_instance_id
    if (instance.vps_instance_id) {
      try {
        console.log('[DIAGNOSTIC] Deletando da VPS (FASE 1):', instance.vps_instance_id);
        
        logStructured({
          timestamp: new Date().toISOString(),
          phase: 'DELETE_INSTANCE_ENHANCED',
          action: 'FASE 1 Deleting from VPS with enhanced diagnostics',
          status: 'start'
        });
        
        await makeVPSRequestWithEnhancedDiagnostics(`/instance/${instance.vps_instance_id}`, 'DELETE', {});
        
        console.log('[DIAGNOSTIC] ✅ Deletado da VPS com sucesso (FASE 1)');
        
        logStructured({
          timestamp: new Date().toISOString(),
          phase: 'DELETE_INSTANCE_ENHANCED',
          action: 'FASE 1 VPS deletion successful',
          status: 'success'
        });
      } catch (vpsError) {
        console.log('[DIAGNOSTIC] ⚠️ Erro ao deletar da VPS (FASE 1 - continuando):', vpsError);
        logStructured({
          timestamp: new Date().toISOString(),
          phase: 'DELETE_INSTANCE_ENHANCED',
          action: 'FASE 1 VPS deletion failed but continuing',
          status: 'warning',
          data: { error: vpsError.message }
        });
      }
    }

    // Deletar do banco
    console.log('[DIAGNOSTIC] Deletando do banco (FASE 1)...');
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(`Erro ao deletar instância do banco: ${deleteError.message}`);
    }

    console.log('[DIAGNOSTIC] ✅ Deletado do banco com sucesso (FASE 1)');

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `FASE 1 Operation ${operationId} deletion completed successfully`,
      status: 'success'
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Instância deletada com sistema FASE 1 aprimorado',
      operationId,
      user_id: user?.id,
      phase: 'FASE_1_DIAGNOSTIC'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log('[DIAGNOSTIC] === ERRO NA DELEÇÃO (FASE 1) ===');
    console.log('[DIAGNOSTIC] Erro:', error);
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `FASE 1 Operation ${operationId} deletion failed`,
      status: 'error',
      data: { error: error.message }
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      operationId,
      action: 'delete_instance',
      instanceId: instanceId,
      phase: 'FASE_1_DIAGNOSTIC'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
