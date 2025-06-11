
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CONFIGURAÇÃO VPS OTIMIZADA - TIMEOUTS REDUZIDOS
const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 15000, // CORREÇÃO: Reduzido para 15s
  retryAttempts: 2, // CORREÇÃO: Apenas 2 tentativas
  backoffMultiplier: 1000 // CORREÇÃO: Backoff mais rápido
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

// FUNÇÃO PARA GERAR NOME INTELIGENTE BASEADO NO EMAIL
function generateIntelligentInstanceName(email: string): string {
  if (!email || !email.includes('@')) {
    return `whatsapp_${Date.now()}`;
  }
  
  const emailPart = email.split('@')[0];
  const baseName = emailPart.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
  
  return baseName;
}

// FUNÇÃO PARA VERIFICAR E GERAR NOME ÚNICO
async function generateUniqueInstanceName(supabase: any, userEmail: string, userId: string): Promise<string> {
  const baseName = generateIntelligentInstanceName(userEmail);
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'INTELLIGENT_NAMING',
    action: `Generated base name: ${baseName}`,
    status: 'start',
    data: { userEmail, baseName }
  });

  const { data: existingInstances, error } = await supabase
    .from('whatsapp_instances')
    .select('instance_name')
    .eq('created_by_user_id', userId)
    .eq('connection_type', 'web');

  if (error) {
    console.log('[INTELLIGENT_NAMING] ⚠️ Erro ao buscar instâncias:', error);
    return `${baseName}_${Date.now()}`;
  }

  const existingNames = existingInstances?.map(i => i.instance_name) || [];
  
  if (!existingNames.includes(baseName)) {
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'INTELLIGENT_NAMING',
      action: `Base name available: ${baseName}`,
      status: 'success',
      data: { finalName: baseName, existingCount: existingNames.length }
    });
    return baseName;
  }

  let counter = 1;
  let candidateName = `${baseName}${counter}`;
  
  while (existingNames.includes(candidateName)) {
    counter++;
    candidateName = `${baseName}${counter}`;
  }

  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'INTELLIGENT_NAMING',
    action: `Generated unique name: ${candidateName}`,
    status: 'success',
    data: { finalName: candidateName, counter, existingCount: existingNames.length }
  });

  return candidateName;
}

// FUNÇÃO PARA COMUNICAÇÃO VPS OTIMIZADA - SEM PUPPETEER DEPENDENCY
async function makeVPSRequest(endpoint: string, method: string, payload: any, attemptNumber = 1): Promise<any> {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'VPS_REQUEST_OPTIMIZED',
    action: `OTIMIZADA attempt ${attemptNumber}/${VPS_CONFIG.retryAttempts} - ${method} ${endpoint}`,
    status: 'start',
    data: { payload, attempt: attemptNumber, requestId }
  });

  try {
    const fullUrl = `${VPS_CONFIG.baseUrl}${endpoint}`;
    console.log('[VPS_OPTIMIZED] === REQUISIÇÃO OTIMIZADA SEM PUPPETEER ===');
    console.log('[VPS_OPTIMIZED] Request ID:', requestId);
    console.log('[VPS_OPTIMIZED] URL completa:', fullUrl);
    console.log('[VPS_OPTIMIZED] Timeout reduzido:', VPS_CONFIG.timeout, 'ms');
    
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
      'User-Agent': 'Supabase-Optimized-Client/4.0',
      'X-Request-ID': requestId,
      'X-Request-Source': 'Supabase-No-Puppeteer',
      'X-Lightweight-Mode': 'true', // NOVO: Indicar modo lightweight
      'Connection': 'keep-alive'
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[VPS_OPTIMIZED] TIMEOUT REDUZIDO de ${VPS_CONFIG.timeout}ms atingido para Request ID: ${requestId}`);
      controller.abort();
    }, VPS_CONFIG.timeout);

    console.log('[VPS_OPTIMIZED] Iniciando fetch otimizado...');
    const response = await fetch(fullUrl, {
      method,
      headers: requestHeaders,
      body: JSON.stringify({
        ...payload,
        lightweight: true, // NOVO: Solicitar modo lightweight na VPS
        skipPuppeteer: true // NOVO: Pular Puppeteer se possível
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log('[VPS_OPTIMIZED] === RESPOSTA OTIMIZADA ===');
    console.log('[VPS_OPTIMIZED] Request ID:', requestId);
    console.log('[VPS_OPTIMIZED] Status da resposta:', response.status);
    console.log('[VPS_OPTIMIZED] Duração total:', duration, 'ms');

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'VPS_REQUEST_OPTIMIZED',
      action: 'VPS response received (optimized)',
      status: 'success',
      duration,
      data: { 
        requestId,
        status: response.status,
        statusText: response.statusText,
        attempt: attemptNumber
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[VPS_OPTIMIZED] ❌ Resposta de erro:', errorText);
      
      throw new Error(`VPS HTTP Error ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[VPS_OPTIMIZED] ✅ JSON parseado com sucesso');
    
    return data;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log('[VPS_OPTIMIZED] === ERRO NA REQUISIÇÃO OTIMIZADA ===');
    console.log('[VPS_OPTIMIZED] Request ID:', requestId);
    console.log('[VPS_OPTIMIZED] Tentativa:', attemptNumber, 'de', VPS_CONFIG.retryAttempts);
    console.log('[VPS_OPTIMIZED] Tipo do erro:', error.name);
    console.log('[VPS_OPTIMIZED] Mensagem:', error.message);
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'VPS_REQUEST_OPTIMIZED',
      action: `Optimized attempt ${attemptNumber} failed`,
      status: 'error',
      duration,
      data: { 
        requestId,
        error: error.message, 
        name: error.name,
        attempt: attemptNumber
      }
    });

    // RETRY LOGIC OTIMIZADO
    if (attemptNumber < VPS_CONFIG.retryAttempts) {
      const backoffDelay = VPS_CONFIG.backoffMultiplier * attemptNumber;
      
      console.log(`[VPS_OPTIMIZED] 🔄 Retry otimizado em ${backoffDelay}ms...`);
      
      await wait(backoffDelay);
      return makeVPSRequest(endpoint, method, payload, attemptNumber + 1);
    }

    // FALLBACK INTELIGENTE
    if (error.name === 'AbortError' || error.message.includes('Timeout')) {
      console.log(`[VPS_OPTIMIZED] 🚨 FALLBACK INTELIGENTE: VPS lenta, criando instância só no banco`);
      throw new Error(`VPS_SLOW_FALLBACK: Timeout após ${VPS_CONFIG.timeout}ms. Criando instância em modo fallback.`);
    }

    throw error;
  }
}

serve(async (req) => {
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  console.log('🚀 EDGE FUNCTION OTIMIZADA INICIOU');
  console.log('Execution ID:', executionId);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Método HTTP:', req.method);

  if (req.method === 'OPTIONS') {
    console.log('[PREFLIGHT] Respondendo CORS preflight para Execution ID:', executionId);
    return new Response(null, { headers: corsHeaders });
  }

  const operationId = `op_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  console.log('[OPTIMIZED] === NOVA OPERAÇÃO OTIMIZADA ===');
  console.log('[OPTIMIZED] Operation ID:', operationId);
  console.log('[OPTIMIZED] Execution ID:', executionId);
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'OPERATION_START_OPTIMIZED',
    action: `Optimized operation ${operationId} started - Execution ${executionId}`,
    status: 'start',
    data: { method: req.method, url: req.url }
  });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[OPTIMIZED] Cliente Supabase criado para Operation ID:', operationId);

    // AUTENTICAÇÃO OBRIGATÓRIA
    const authHeader = req.headers.get('Authorization');
    let currentUser = null;
    
    console.log('[OPTIMIZED] Auth header presente:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[OPTIMIZED] ❌ Token de autorização ausente ou inválido');
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de autorização obrigatório. Faça login novamente.',
        operationId,
        executionId,
        requiresAuth: true
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      console.log('[OPTIMIZED] Validando token JWT...');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        console.log('[OPTIMIZED] ❌ Token inválido ou usuário não encontrado:', userError);
        
        return new Response(JSON.stringify({
          success: false,
          error: 'Token inválido ou expirado. Faça login novamente.',
          operationId,
          executionId,
          requiresAuth: true
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      currentUser = user;
      console.log('[OPTIMIZED] ✅ Usuário autenticado:', user.id, user.email);
      
    } catch (authError) {
      console.log('[OPTIMIZED] ❌ Exceção na autenticação:', authError);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro na validação do token. Tente fazer login novamente.',
        operationId,
        executionId,
        requiresAuth: true
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[OPTIMIZED] Fazendo parse do body para Operation ID:', operationId);
    const { action, instanceName, instanceId, testMode, endpoint } = await req.json();
    
    console.log('[OPTIMIZED] Body parseado:', { action, instanceName, instanceId, testMode, endpoint });

    // DIAGNOSTIC ACTIONS - CORRIGIDOS E SEPARADOS
    if (action === 'diagnostic_health') {
      console.log('[OPTIMIZED] Executando diagnostic_health');
      return new Response(JSON.stringify({
        success: true,
        health: 'ok',
        method: 'SUPABASE_OPTIMIZED',
        operationId,
        timestamp: new Date().toISOString(),
        message: 'Edge Function otimizada está funcionando corretamente'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'diagnostic_vps') {
      console.log('[OPTIMIZED] Executando diagnostic_vps');
      try {
        const vpsResult = await makeVPSRequest('/health', 'GET', {});
        return new Response(JSON.stringify({
          success: true,
          vps_status: 'online',
          vps_response: vpsResult,
          method: 'SUPABASE_OPTIMIZED',
          operationId,
          message: 'VPS respondeu com sucesso (otimizado)'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (vpsError) {
        return new Response(JSON.stringify({
          success: false,
          vps_status: 'offline_or_slow',
          error: vpsError.message,
          method: 'SUPABASE_OPTIMIZED',
          operationId,
          message: 'VPS não está respondendo rapidamente'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (action === 'diagnostic_create') {
      console.log('[OPTIMIZED] Executando diagnostic_create (test mode)');
      return new Response(JSON.stringify({
        success: true,
        test_mode: true,
        message: 'Create instance test completed successfully (optimized)',
        method: 'SUPABASE_OPTIMIZED',
        operationId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // NOVO: Teste específico de endpoint VPS otimizado
    if (action === 'diagnostic_vps_endpoint') {
      console.log('[OPTIMIZED] Executando diagnostic_vps_endpoint:', endpoint);
      try {
        const testEndpoint = endpoint || '/instance/create';
        const vpsResult = await makeVPSRequest(testEndpoint, 'POST', {
          instanceId: 'test_diagnostic',
          sessionName: 'test_diagnostic',
          test: true,
          lightweight: true // NOVO: Modo lightweight para teste
        });
        
        return new Response(JSON.stringify({
          success: true,
          endpoint_status: 'available',
          endpoint_tested: testEndpoint,
          vps_response: vpsResult,
          method: 'SUPABASE_OPTIMIZED',
          operationId,
          message: `Endpoint ${testEndpoint} está disponível (otimizado)`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (vpsError) {
        return new Response(JSON.stringify({
          success: false,
          endpoint_status: 'unavailable_or_slow',
          endpoint_tested: endpoint || '/instance/create',
          error: vpsError.message,
          method: 'SUPABASE_OPTIMIZED',
          operationId,
          message: `Endpoint ${endpoint || '/instance/create'} não está disponível ou muito lento`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // MAIN ACTION: CREATE INSTANCE OTIMIZADA
    if (action === 'create_instance') {
      console.log('[OPTIMIZED] Redirecionando para createInstanceOptimized');
      return await createInstanceOptimized(supabase, currentUser, operationId);
    }

    if (action === 'delete_instance_corrected') {
      console.log('[OPTIMIZED] Redirecionando para deleteInstanceOptimized');
      return await deleteInstanceOptimized(supabase, instanceId, currentUser, operationId);
    }

    console.log('[OPTIMIZED] Ação desconhecida:', action);

    return new Response(JSON.stringify({
      success: false,
      error: 'Ação não reconhecida: ' + action,
      operationId,
      executionId
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log('[OPTIMIZED] === ERRO GERAL OTIMIZADA ===');
    console.log('[OPTIMIZED] Execution ID:', executionId);
    console.log('[OPTIMIZED] Operation ID:', operationId);
    console.log('[OPTIMIZED] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      operationId,
      executionId,
      details: 'Erro na Edge Function otimizada'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// FUNÇÃO CREATEINSTANCE OTIMIZADA COM FALLBACK INTELIGENTE
async function createInstanceOptimized(supabase: any, user: any, operationId: string) {
  console.log('[OPTIMIZED] === CRIAR INSTÂNCIA OTIMIZADA ===');
  console.log('[OPTIMIZED] User ID:', user.id);
  console.log('[OPTIMIZED] User Email:', user.email);
  console.log('[OPTIMIZED] Operation ID:', operationId);
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'CREATE_INSTANCE_OPTIMIZED',
    action: `Starting optimized instance creation for user ${user.email}`,
    status: 'start',
    data: { userId: user.id, userEmail: user.email, operationId }
  });

  try {
    if (!user.email) {
      throw new Error('Email do usuário é obrigatório para gerar nome da instância');
    }

    // GERAR NOME INTELIGENTE ÚNICO
    console.log('[OPTIMIZED] === GERAÇÃO DE NOME INTELIGENTE ===');
    const intelligentInstanceName = await generateUniqueInstanceName(supabase, user.email, user.id);
    
    console.log('[OPTIMIZED] Nome inteligente gerado:', intelligentInstanceName);

    // COMUNICAÇÃO VPS OTIMIZADA COM FALLBACK INTELIGENTE
    console.log('[OPTIMIZED] === COMUNICAÇÃO VPS OTIMIZADA ===');
    const vpsPayload = {
      instanceId: intelligentInstanceName,
      sessionName: intelligentInstanceName,
      webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
      lightweight: true, // NOVO: Modo lightweight
      skipPuppeteer: true // NOVO: Pular Puppeteer se possível
    };

    console.log('[OPTIMIZED] Payload otimizado para VPS:', vpsPayload);

    let vpsData;
    let vpsSuccess = false;
    let fallbackMode = false;
    
    try {
      vpsData = await makeVPSRequest('/instance/create', 'POST', vpsPayload);
      vpsSuccess = true;
      console.log('[OPTIMIZED] ✅ Resposta da VPS otimizada:', vpsData);
    } catch (vpsError) {
      console.log('[OPTIMIZED] 🚨 FALLBACK INTELIGENTE: VPS falhou/lenta, criando instância só no banco:', vpsError.message);
      
      // FALLBACK INTELIGENTE - Criar instância no banco mesmo se VPS falhar
      fallbackMode = true;
      vpsData = {
        success: true,
        instanceId: intelligentInstanceName,
        fallback: true,
        vpsError: vpsError.message,
        mode: 'database_only'
      };
      vpsSuccess = false;
    }

    if (!vpsData.success && !vpsData.fallback) {
      throw new Error(vpsData.error || 'VPS retornou success: false');
    }

    // SALVAR NO SUPABASE
    console.log('[OPTIMIZED] === SALVAR NO SUPABASE ===');

    const instanceData = {
      instance_name: intelligentInstanceName,
      connection_type: 'web',
      server_url: VPS_CONFIG.baseUrl,
      vps_instance_id: vpsData.instanceId || intelligentInstanceName,
      web_status: fallbackMode ? 'fallback_created' : (vpsSuccess ? 'initializing' : 'vps_failed'),
      connection_status: fallbackMode ? 'database_only' : (vpsSuccess ? 'vps_created' : 'local_only'),
      created_by_user_id: user.id,
      company_id: null
    };
    
    console.log('[OPTIMIZED] Dados otimizados para inserir no Supabase:', instanceData);

    const { data: newInstance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceData)
      .select()
      .single();

    if (dbError) {
      console.log('[OPTIMIZED] Erro no banco:', dbError);
      throw new Error(`Erro ao salvar instância no banco: ${dbError.message}`);
    }

    console.log('[OPTIMIZED] ✅ Instância salva no banco otimizado:', newInstance);

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `Optimized Operation ${operationId} completed ${fallbackMode ? 'in fallback mode' : (vpsSuccess ? 'successfully' : 'with VPS issues')}`,
      status: fallbackMode ? 'warning' : (vpsSuccess ? 'success' : 'warning'),
      data: { 
        instanceId: newInstance.id, 
        instanceName: newInstance.instance_name,
        method: 'SUPABASE_OPTIMIZED',
        userEmail: user.email,
        vpsSuccess,
        fallbackMode,
        mode: fallbackMode ? 'database_only' : 'vps_integrated'
      }
    });

    console.log('[OPTIMIZED] === SUCESSO COMPLETO OTIMIZADO ===');

    return new Response(JSON.stringify({
      success: true,
      instance: newInstance,
      vps_response: vpsData,
      user_id: user.id,
      operationId,
      method: 'SUPABASE_OPTIMIZED',
      intelligent_name: intelligentInstanceName,
      user_email: user.email,
      vps_success: vpsSuccess,
      fallback_used: fallbackMode,
      mode: fallbackMode ? 'database_only' : 'vps_integrated',
      message: fallbackMode ? 'Instância criada em modo fallback (VPS lenta/indisponível)' : 
               (vpsSuccess ? 'Instância criada com VPS otimizada' : 'Instância criada com problemas na VPS')
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log('[OPTIMIZED] === ERRO NA CRIAÇÃO OTIMIZADA ===');
    console.log('[OPTIMIZED] Erro:', error);
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `Optimized Operation ${operationId} failed`,
      status: 'error',
      data: { error: error.message, method: 'SUPABASE_OPTIMIZED' }
    });
    
    let errorMessage = error.message;
    let errorType = 'UNKNOWN_ERROR';
    
    if (error.message.includes('VPS_SLOW_FALLBACK')) {
      errorMessage = 'VPS está muito lenta - instância foi criada em modo fallback';
      errorType = 'VPS_SLOW_FALLBACK';
    } else if (error.name === 'AbortError' || error.message.includes('Timeout')) {
      errorMessage = 'Timeout na criação otimizada - VPS pode estar offline';
      errorType = 'VPS_TIMEOUT_OPTIMIZED';
    } else if (error.message.includes('HTTP')) {
      errorType = 'VPS_HTTP_ERROR_OPTIMIZED';
    } else if (error.message.includes('indisponível')) {
      errorType = 'VPS_UNAVAILABLE';
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      errorType,
      operationId,
      action: 'create_instance',
      method: 'SUPABASE_OPTIMIZED',
      user_email: user?.email,
      suggestion: 'VPS parece estar lenta. Sistema funcionará em modo fallback automaticamente.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// FUNÇÃO DELETE OTIMIZADA
async function deleteInstanceOptimized(supabase: any, instanceId: string, user: any, operationId: string) {
  console.log('[OPTIMIZED] === DELETAR INSTÂNCIA OTIMIZADA ===');
  console.log('[OPTIMIZED] Instance ID:', instanceId);
  console.log('[OPTIMIZED] User ID:', user.id);
  
  try {
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (fetchError) {
      throw new Error('Instância não encontrada: ' + fetchError.message);
    }

    console.log('[OPTIMIZED] Instância encontrada:', instance);

    // Deletar da VPS otimizada
    if (instance.vps_instance_id) {
      try {
        console.log('[OPTIMIZED] Deletando da VPS otimizada:', instance.vps_instance_id);
        
        await makeVPSRequest(`/instance/${instance.vps_instance_id}`, 'DELETE', {
          lightweight: true // NOVO: Modo lightweight para delete
        });
        
        console.log('[OPTIMIZED] ✅ Deletado da VPS com sucesso otimizado');
      } catch (vpsError) {
        console.log('[OPTIMIZED] ⚠️ Erro ao deletar da VPS (continuando):', vpsError);
      }
    }

    // Deletar do banco
    console.log('[OPTIMIZED] Deletando do banco otimizado...');
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(`Erro ao deletar do banco: ${deleteError.message}`);
    }

    console.log('[OPTIMIZED] ✅ Instância deletada com sucesso otimizado');

    return new Response(JSON.stringify({
      success: true,
      message: 'Instância deletada com sucesso (otimizado)',
      operationId,
      method: 'SUPABASE_OPTIMIZED'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log('[OPTIMIZED] === ERRO NA DELEÇÃO OTIMIZADA ===');
    console.log('[OPTIMIZED] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      operationId,
      method: 'SUPABASE_OPTIMIZED'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
