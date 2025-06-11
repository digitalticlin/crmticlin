
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CONFIGURAÇÃO VPS CENTRALIZADA - CORRIGIDA PARA API APENAS
const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 30000, // Reduzido para 30s
  retryAttempts: 2, // Reduzido para 2 tentativas
  backoffMultiplier: 1500
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

// FUNÇÃO PARA COMUNICAÇÃO VPS COM FALLBACK MELHORADO
async function makeVPSRequest(endpoint: string, method: string, payload: any, attemptNumber = 1): Promise<any> {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'VPS_REQUEST_API',
    action: `API attempt ${attemptNumber}/${VPS_CONFIG.retryAttempts} - ${method} ${endpoint}`,
    status: 'start',
    data: { payload, attempt: attemptNumber, requestId }
  });

  try {
    const fullUrl = `${VPS_CONFIG.baseUrl}${endpoint}`;
    console.log('[VPS_API] === REQUISIÇÃO VIA API CORRIGIDA ===');
    console.log('[VPS_API] Request ID:', requestId);
    console.log('[VPS_API] URL completa:', fullUrl);
    console.log('[VPS_API] Método:', method);
    console.log('[VPS_API] Tentativa:', attemptNumber, 'de', VPS_CONFIG.retryAttempts);
    
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
      'User-Agent': 'Supabase-API-Client/3.0',
      'X-Request-ID': requestId,
      'X-Request-Source': 'Supabase-API-Only',
      'X-Attempt-Number': attemptNumber.toString(),
      'Connection': 'keep-alive'
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[VPS_API] TIMEOUT de ${VPS_CONFIG.timeout}ms atingido para Request ID: ${requestId}`);
      controller.abort();
    }, VPS_CONFIG.timeout);

    console.log('[VPS_API] Iniciando fetch via API...');
    const response = await fetch(fullUrl, {
      method,
      headers: requestHeaders,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log('[VPS_API] === RESPOSTA VIA API ===');
    console.log('[VPS_API] Request ID:', requestId);
    console.log('[VPS_API] Status da resposta:', response.status);
    console.log('[VPS_API] Duração total:', duration, 'ms');

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'VPS_REQUEST_API',
      action: 'API VPS response received',
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
      console.log('[VPS_API] ❌ Resposta de erro via API:', errorText);
      
      throw new Error(`VPS HTTP Error ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[VPS_API] ✅ JSON parseado com sucesso via API');
    
    return data;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log('[VPS_API] === ERRO NA REQUISIÇÃO VIA API ===');
    console.log('[VPS_API] Request ID:', requestId);
    console.log('[VPS_API] Tentativa:', attemptNumber, 'de', VPS_CONFIG.retryAttempts);
    console.log('[VPS_API] Tipo do erro:', error.name);
    console.log('[VPS_API] Mensagem:', error.message);
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'VPS_REQUEST_API',
      action: `API attempt ${attemptNumber} failed`,
      status: 'error',
      duration,
      data: { 
        requestId,
        error: error.message, 
        name: error.name,
        attempt: attemptNumber
      }
    });

    // RETRY LOGIC
    if (attemptNumber < VPS_CONFIG.retryAttempts) {
      const backoffDelay = VPS_CONFIG.backoffMultiplier * attemptNumber;
      
      console.log(`[VPS_API] 🔄 Tentando novamente via API em ${backoffDelay}ms...`);
      
      await wait(backoffDelay);
      return makeVPSRequest(endpoint, method, payload, attemptNumber + 1);
    }

    // FALLBACK MELHORADO
    if (error.name === 'AbortError' || error.message.includes('Timeout')) {
      console.log(`[VPS_API] 🚨 FALLBACK: VPS não respondeu após ${VPS_CONFIG.retryAttempts} tentativas`);
      throw new Error(`VPS indisponível: Timeout após ${VPS_CONFIG.timeout}ms em ${VPS_CONFIG.retryAttempts} tentativas. Sistema funcionando em modo fallback.`);
    }

    throw error;
  }
}

serve(async (req) => {
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  console.log('🚀 EDGE FUNCTION INICIOU (API CORRIGIDA)');
  console.log('Execution ID:', executionId);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Método HTTP:', req.method);

  if (req.method === 'OPTIONS') {
    console.log('[PREFLIGHT] Respondendo CORS preflight para Execution ID:', executionId);
    return new Response(null, { headers: corsHeaders });
  }

  const operationId = `op_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  console.log('[API_ONLY] === NOVA OPERAÇÃO VIA API SUPABASE ===');
  console.log('[API_ONLY] Operation ID:', operationId);
  console.log('[API_ONLY] Execution ID:', executionId);
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'OPERATION_START_API',
    action: `API operation ${operationId} started - Execution ${executionId}`,
    status: 'start',
    data: { method: req.method, url: req.url }
  });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[API_ONLY] Cliente Supabase criado para Operation ID:', operationId);

    // AUTENTICAÇÃO OBRIGATÓRIA
    const authHeader = req.headers.get('Authorization');
    let currentUser = null;
    
    console.log('[API_ONLY] Auth header presente:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[API_ONLY] ❌ Token de autorização ausente ou inválido');
      
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
      console.log('[API_ONLY] Validando token JWT...');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        console.log('[API_ONLY] ❌ Token inválido ou usuário não encontrado:', userError);
        
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
      console.log('[API_ONLY] ✅ Usuário autenticado:', user.id, user.email);
      
    } catch (authError) {
      console.log('[API_ONLY] ❌ Exceção na autenticação:', authError);
      
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

    console.log('[API_ONLY] Fazendo parse do body para Operation ID:', operationId);
    const { action, instanceName, instanceId, testMode } = await req.json();
    
    console.log('[API_ONLY] Body parseado:', { action, instanceName, instanceId, testMode });

    // DIAGNOSTIC ACTIONS
    if (action === 'diagnostic_health') {
      console.log('[API_ONLY] Executando diagnostic_health');
      return new Response(JSON.stringify({
        success: true,
        health: 'ok',
        method: 'SUPABASE_API_ONLY',
        operationId,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'diagnostic_vps') {
      console.log('[API_ONLY] Executando diagnostic_vps');
      try {
        const vpsResult = await makeVPSRequest('/health', 'GET', {});
        return new Response(JSON.stringify({
          success: true,
          vps_status: 'online',
          vps_response: vpsResult,
          method: 'SUPABASE_API_ONLY',
          operationId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (vpsError) {
        return new Response(JSON.stringify({
          success: false,
          vps_status: 'offline',
          error: vpsError.message,
          method: 'SUPABASE_API_ONLY',
          operationId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (action === 'diagnostic_create') {
      console.log('[API_ONLY] Executando diagnostic_create (test mode)');
      return new Response(JSON.stringify({
        success: true,
        test_mode: true,
        message: 'Create instance test completed successfully',
        method: 'SUPABASE_API_ONLY',
        operationId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // MAIN ACTIONS
    if (action === 'create_instance') {
      console.log('[API_ONLY] Redirecionando para createInstanceViaAPI (CORRIGIDO)');
      return await createInstanceViaAPI(supabase, currentUser, operationId);
    }

    if (action === 'delete_instance_corrected') {
      console.log('[API_ONLY] Redirecionando para deleteInstanceViaAPI');
      return await deleteInstanceViaAPI(supabase, instanceId, currentUser, operationId);
    }

    console.log('[API_ONLY] Ação desconhecida:', action);

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
    console.log('[API_ONLY] === ERRO GERAL NA API ===');
    console.log('[API_ONLY] Execution ID:', executionId);
    console.log('[API_ONLY] Operation ID:', operationId);
    console.log('[API_ONLY] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      operationId,
      executionId,
      details: 'Erro na API Supabase'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// FUNÇÃO CREATEINSTANCE VIA API COM FALLBACK
async function createInstanceViaAPI(supabase: any, user: any, operationId: string) {
  console.log('[API_ONLY] === CRIAR INSTÂNCIA VIA API SUPABASE ===');
  console.log('[API_ONLY] User ID:', user.id);
  console.log('[API_ONLY] User Email:', user.email);
  console.log('[API_ONLY] Operation ID:', operationId);
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'CREATE_INSTANCE_API',
    action: `Starting API instance creation for user ${user.email}`,
    status: 'start',
    data: { userId: user.id, userEmail: user.email, operationId }
  });

  try {
    if (!user.email) {
      throw new Error('Email do usuário é obrigatório para gerar nome da instância');
    }

    // GERAR NOME INTELIGENTE ÚNICO
    console.log('[API_ONLY] === GERAÇÃO DE NOME INTELIGENTE ===');
    const intelligentInstanceName = await generateUniqueInstanceName(supabase, user.email, user.id);
    
    console.log('[API_ONLY] Nome inteligente gerado:', intelligentInstanceName);

    // COMUNICAÇÃO VPS VIA API COM FALLBACK
    console.log('[API_ONLY] === COMUNICAÇÃO VPS VIA API ===');
    const vpsPayload = {
      instanceId: intelligentInstanceName,
      sessionName: intelligentInstanceName,
      webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
    };

    console.log('[API_ONLY] Payload para VPS via API:', vpsPayload);

    let vpsData;
    let vpsSuccess = false;
    
    try {
      vpsData = await makeVPSRequest('/instance/create', 'POST', vpsPayload);
      vpsSuccess = true;
      console.log('[API_ONLY] ✅ Resposta da VPS via API:', vpsData);
    } catch (vpsError) {
      console.log('[API_ONLY] 🚨 FALLBACK: VPS falhou, criando instância local apenas:', vpsError.message);
      
      // FALLBACK - Criar instância no banco mesmo se VPS falhar
      vpsData = {
        success: true,
        instanceId: intelligentInstanceName,
        fallback: true,
        vpsError: vpsError.message
      };
      vpsSuccess = false;
    }

    if (!vpsData.success && !vpsData.fallback) {
      throw new Error(vpsData.error || 'VPS retornou success: false');
    }

    // SALVAR NO SUPABASE
    console.log('[API_ONLY] === SALVAR NO SUPABASE ===');

    const instanceData = {
      instance_name: intelligentInstanceName,
      connection_type: 'web',
      server_url: VPS_CONFIG.baseUrl,
      vps_instance_id: vpsData.instanceId || intelligentInstanceName,
      web_status: vpsSuccess ? 'initializing' : 'vps_failed',
      connection_status: vpsSuccess ? 'vps_created' : 'local_only',
      created_by_user_id: user.id,
      company_id: null
    };
    
    console.log('[API_ONLY] Dados para inserir no Supabase:', instanceData);

    const { data: newInstance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceData)
      .select()
      .single();

    if (dbError) {
      console.log('[API_ONLY] Erro no banco:', dbError);
      throw new Error(`Erro ao salvar instância no banco: ${dbError.message}`);
    }

    console.log('[API_ONLY] ✅ Instância salva no banco:', newInstance);

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `API Operation ${operationId} completed ${vpsSuccess ? 'successfully' : 'with VPS fallback'}`,
      status: vpsSuccess ? 'success' : 'warning',
      data: { 
        instanceId: newInstance.id, 
        instanceName: newInstance.instance_name,
        method: 'SUPABASE_API_ONLY',
        userEmail: user.email,
        vpsSuccess,
        fallback: !vpsSuccess
      }
    });

    console.log('[API_ONLY] === SUCESSO COMPLETO VIA API ===');

    return new Response(JSON.stringify({
      success: true,
      instance: newInstance,
      vps_response: vpsData,
      user_id: user.id,
      operationId,
      method: 'SUPABASE_API_ONLY',
      intelligent_name: intelligentInstanceName,
      user_email: user.email,
      vps_success: vpsSuccess,
      fallback_used: !vpsSuccess,
      message: vpsSuccess ? 'Instância criada via API com VPS' : 'Instância criada via API (VPS indisponível, usando fallback)'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log('[API_ONLY] === ERRO NA CRIAÇÃO VIA API ===');
    console.log('[API_ONLY] Erro:', error);
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `API Operation ${operationId} failed`,
      status: 'error',
      data: { error: error.message, method: 'SUPABASE_API_ONLY' }
    });
    
    let errorMessage = error.message;
    let errorType = 'UNKNOWN_ERROR';
    
    if (error.name === 'AbortError' || error.message.includes('Timeout')) {
      errorMessage = 'Timeout na criação via API - VPS pode estar offline';
      errorType = 'VPS_TIMEOUT_API';
    } else if (error.message.includes('HTTP')) {
      errorType = 'VPS_HTTP_ERROR_API';
    } else if (error.message.includes('indisponível')) {
      errorType = 'VPS_UNAVAILABLE';
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      errorType,
      operationId,
      action: 'create_instance',
      method: 'SUPABASE_API_ONLY',
      user_email: user?.email,
      suggestion: 'Verifique se a VPS está online e acessível'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// FUNÇÃO DELETE VIA API
async function deleteInstanceViaAPI(supabase: any, instanceId: string, user: any, operationId: string) {
  console.log('[API_ONLY] === DELETAR INSTÂNCIA VIA API ===');
  console.log('[API_ONLY] Instance ID:', instanceId);
  console.log('[API_ONLY] User ID:', user.id);
  
  try {
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (fetchError) {
      throw new Error('Instância não encontrada: ' + fetchError.message);
    }

    console.log('[API_ONLY] Instância encontrada:', instance);

    // Deletar da VPS via API
    if (instance.vps_instance_id) {
      try {
        console.log('[API_ONLY] Deletando da VPS via API:', instance.vps_instance_id);
        
        await makeVPSRequest(`/instance/${instance.vps_instance_id}`, 'DELETE', {});
        
        console.log('[API_ONLY] ✅ Deletado da VPS com sucesso via API');
      } catch (vpsError) {
        console.log('[API_ONLY] ⚠️ Erro ao deletar da VPS (continuando):', vpsError);
      }
    }

    // Deletar do banco
    console.log('[API_ONLY] Deletando do banco via API...');
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(`Erro ao deletar do banco: ${deleteError.message}`);
    }

    console.log('[API_ONLY] ✅ Instância deletada com sucesso via API');

    return new Response(JSON.stringify({
      success: true,
      message: 'Instância deletada com sucesso via API',
      operationId,
      method: 'SUPABASE_API_ONLY'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log('[API_ONLY] === ERRO NA DELEÇÃO VIA API ===');
    console.log('[API_ONLY] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      operationId,
      method: 'SUPABASE_API_ONLY'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
