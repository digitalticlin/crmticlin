import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// FASE 2: CONFIGURAÇÃO OTIMIZADA SEM HEALTH CHECK OBRIGATÓRIO
const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 30000, // 30s para criação direta
  retryAttempts: 3,
  backoffMultiplier: 1500
};

interface LogEntry {
  timestamp: string;
  phase: string;
  action: string;
  duration?: number;
  status: 'start' | 'success' | 'error' | 'warning';
  data?: any;
  origin?: string;
  headers?: any;
}

function logStructured(entry: LogEntry) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${entry.phase}] ${entry.action} - ${entry.status}${entry.duration ? ` (${entry.duration}ms)` : ''}`;
  console.log(logLine, entry.data ? JSON.stringify(entry.data) : '');
}

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// FASE 2: FUNÇÃO PARA GERAR NOME INTELIGENTE BASEADO NO EMAIL
function generateIntelligentInstanceName(email: string): string {
  if (!email || !email.includes('@')) {
    return `whatsapp_${Date.now()}`;
  }
  
  // Converter email para nome válido
  const emailPart = email.split('@')[0];
  const domainPart = email.split('@')[1].replace(/\./g, '_');
  const baseName = `${emailPart}_${domainPart}`.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
  
  return baseName;
}

// FASE 2: FUNÇÃO PARA VERIFICAR E GERAR NOME ÚNICO
async function generateUniqueInstanceName(supabase: any, userEmail: string, userId: string): Promise<string> {
  const baseName = generateIntelligentInstanceName(userEmail);
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'INTELLIGENT_NAMING',
    action: `Generated base name: ${baseName}`,
    status: 'start',
    data: { userEmail, baseName }
  });

  // Verificar instâncias existentes do usuário
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
  
  // Se o nome base não existe, usar ele
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

  // Encontrar próximo número disponível
  let counter = 2;
  let candidateName = `${baseName}_${counter}`;
  
  while (existingNames.includes(candidateName)) {
    counter++;
    candidateName = `${baseName}_${counter}`;
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

// FASE 2: REQUISIÇÃO VPS DIRETTA (SEM HEALTH CHECK)
async function makeDirectVPSRequest(endpoint: string, method: string, payload: any, attemptNumber = 1): Promise<any> {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'DIRECT_VPS_REQUEST',
    action: `Direct attempt ${attemptNumber}/${VPS_CONFIG.retryAttempts} - ${method} ${endpoint}`,
    status: 'start',
    data: { payload, attempt: attemptNumber, requestId }
  });

  try {
    const fullUrl = `${VPS_CONFIG.baseUrl}${endpoint}`;
    console.log('[DIRECT_VPS] === REQUISIÇÃO DIRETA VPS ===');
    console.log('[DIRECT_VPS] Request ID:', requestId);
    console.log('[DIRECT_VPS] URL completa:', fullUrl);
    console.log('[DIRECT_VPS] Método:', method);
    console.log('[DIRECT_VPS] Tentativa:', attemptNumber, 'de', VPS_CONFIG.retryAttempts);
    console.log('[DIRECT_VPS] Timeout configurado:', VPS_CONFIG.timeout, 'ms');
    
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
      'User-Agent': 'Supabase-Edge-Direct/2.0',
      'X-Request-ID': requestId,
      'X-Request-Source': 'Supabase-Direct-Creation',
      'X-Attempt-Number': attemptNumber.toString(),
      'X-Request-Time': new Date().toISOString()
    };
    
    console.log('[DIRECT_VPS] Headers da requisição:', requestHeaders);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[DIRECT_VPS] TIMEOUT de ${VPS_CONFIG.timeout}ms atingido para Request ID: ${requestId}`);
      controller.abort();
    }, VPS_CONFIG.timeout);

    console.log('[DIRECT_VPS] Iniciando fetch direto...');
    const response = await fetch(fullUrl, {
      method,
      headers: requestHeaders,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log('[DIRECT_VPS] === RESPOSTA DIRETA RECEBIDA ===');
    console.log('[DIRECT_VPS] Request ID:', requestId);
    console.log('[DIRECT_VPS] Status da resposta:', response.status);
    console.log('[DIRECT_VPS] Status text:', response.statusText);
    console.log('[DIRECT_VPS] Duração total:', duration, 'ms');

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'DIRECT_VPS_REQUEST',
      action: 'Direct VPS response received',
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
      console.log('[DIRECT_VPS] ❌ Resposta de erro (Request ID:', requestId, '):', errorText);
      
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'DIRECT_VPS_REQUEST',
        action: `Direct VPS returned error ${response.status}`,
        status: 'error',
        duration,
        data: { requestId, status: response.status, error: errorText, statusText: response.statusText }
      });
      
      throw new Error(`VPS HTTP Error ${response.status}: ${response.statusText} - ${errorText} (Request ID: ${requestId})`);
    }

    console.log('[DIRECT_VPS] Fazendo parse do JSON...');
    const data = await response.json();
    console.log('[DIRECT_VPS] ✅ JSON parseado com sucesso (Request ID:', requestId, ')');
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'DIRECT_VPS_REQUEST',
      action: 'Direct VPS request successful',
      status: 'success',
      duration,
      data: { requestId, success: data.success, instanceId: data.instanceId }
    });

    return data;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log('[DIRECT_VPS] === ERRO NA REQUISIÇÃO DIRETA ===');
    console.log('[DIRECT_VPS] Request ID:', requestId);
    console.log('[DIRECT_VPS] Tentativa:', attemptNumber, 'de', VPS_CONFIG.retryAttempts);
    console.log('[DIRECT_VPS] Tipo do erro:', error.name);
    console.log('[DIRECT_VPS] Mensagem:', error.message);
    console.log('[DIRECT_VPS] Duração até erro:', duration, 'ms');
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'DIRECT_VPS_REQUEST',
      action: `Direct attempt ${attemptNumber} failed`,
      status: 'error',
      duration,
      data: { 
        requestId,
        error: error.message, 
        name: error.name,
        isAborted: error.name === 'AbortError',
        attempt: attemptNumber
      }
    });

    // RETRY LOGIC
    if (attemptNumber < VPS_CONFIG.retryAttempts) {
      const backoffDelay = VPS_CONFIG.backoffMultiplier * attemptNumber;
      
      console.log(`[DIRECT_VPS] 🔄 Tentando novamente Request ID ${requestId} em ${backoffDelay}ms... (tentativa ${attemptNumber + 1}/${VPS_CONFIG.retryAttempts})`);
      
      await wait(backoffDelay);
      return makeDirectVPSRequest(endpoint, method, payload, attemptNumber + 1);
    }

    if (error.name === 'AbortError') {
      throw new Error(`VPS Timeout após ${VPS_CONFIG.timeout}ms - tentativa direta falhou (Request ID: ${requestId})`);
    }

    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const operationId = `op_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  console.log('[DIRECT] === NOVA OPERAÇÃO DIRETA (FASE 2) ===');
  console.log('[DIRECT] Operation ID:', operationId);
  console.log('[DIRECT] Método HTTP:', req.method);
  console.log('[DIRECT] URL:', req.url);
  console.log('[DIRECT] Configuração VPS:', {
    baseUrl: VPS_CONFIG.baseUrl,
    timeout: VPS_CONFIG.timeout,
    retryAttempts: VPS_CONFIG.retryAttempts
  });
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'OPERATION_START_DIRECT',
    action: `Direct operation ${operationId} started (FASE 2)`,
    status: 'start',
    data: { method: req.method, url: req.url, vpsConfig: VPS_CONFIG }
  });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[DIRECT] Cliente Supabase criado');

    // ... keep existing code (authentication logic) the same ...

    const authHeader = req.headers.get('Authorization');
    let currentUser = null;
    
    console.log('[DIRECT] Auth header presente:', !!authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'AUTHENTICATION',
        action: 'Validating JWT token',
        status: 'start'
      });
      
      try {
        console.log('[DIRECT] Validando token JWT...');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError) {
          console.log('[DIRECT] Erro na validação:', userError);
          logStructured({
            timestamp: new Date().toISOString(),
            phase: 'AUTHENTICATION',
            action: 'JWT validation failed',
            status: 'error',
            data: { error: userError.message, code: userError.code }
          });
        } else if (user) {
          currentUser = user;
          console.log('[DIRECT] Usuário autenticado:', user.id, user.email);
          logStructured({
            timestamp: new Date().toISOString(),
            phase: 'AUTHENTICATION',
            action: 'User authenticated successfully',
            status: 'success',
            data: { userId: user.id, email: user.email }
          });
        }
      } catch (authError) {
        console.log('[DIRECT] Exceção na autenticação:', authError);
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
      console.log('[DIRECT] Usuário não autenticado, retornando 401');
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

    console.log('[DIRECT] Fazendo parse do body...');
    const { action, instanceName, instanceId } = await req.json();
    
    console.log('[DIRECT] Body parseado:', { action, instanceName, instanceId });
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'REQUEST_PARSING',
      action: `Action received: ${action}`,
      status: 'success',
      data: { action, instanceName, instanceId, userId: currentUser.id }
    });

    if (action === 'create_instance') {
      console.log('[DIRECT] Redirecionando para createInstanceDirect');
      return await createInstanceDirect(supabase, currentUser, operationId);
    }

    if (action === 'delete_instance_corrected') {
      console.log('[DIRECT] Redirecionando para deleteInstanceDirect');
      return await deleteInstanceDirect(supabase, instanceId, currentUser, operationId);
    }

    console.log('[DIRECT] Ação desconhecida:', action);
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
    console.log('[DIRECT] === ERRO GERAL NA EDGE FUNCTION ===');
    console.log('[DIRECT] Erro:', error);
    console.log('[DIRECT] Stack:', error.stack);
    
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
      details: 'Erro na Edge Function com criação direta FASE 2'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// FASE 2: FUNÇÃO CREATEINSTANCE DIRETA (SEM HEALTH CHECK)
async function createInstanceDirect(supabase: any, user: any, operationId: string) {
  console.log('[DIRECT] === CRIAR INSTÂNCIA DIRETA (FASE 2) ===');
  console.log('[DIRECT] User ID:', user.id);
  console.log('[DIRECT] User Email:', user.email);
  console.log('[DIRECT] Operation ID:', operationId);
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'CREATE_INSTANCE_DIRECT',
    action: `Starting FASE 2 direct instance creation for user ${user.email}`,
    status: 'start',
    data: { userId: user.id, userEmail: user.email, operationId }
  });

  try {
    if (!user.email) {
      throw new Error('Email do usuário é obrigatório para gerar nome da instância');
    }

    // FASE 2: GERAR NOME INTELIGENTE ÚNICO
    console.log('[DIRECT] === FASE 2: GERAÇÃO DE NOME INTELIGENTE ===');
    const intelligentInstanceName = await generateUniqueInstanceName(supabase, user.email, user.id);
    
    console.log('[DIRECT] Nome inteligente gerado:', intelligentInstanceName);
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE_DIRECT',
      action: 'Intelligent instance name generated',
      status: 'success',
      data: { originalEmail: user.email, intelligentName: intelligentInstanceName }
    });

    // FASE 2: COMUNICAÇÃO DIRETA COM VPS (SEM HEALTH CHECK)
    console.log('[DIRECT] === FASE 2: COMUNICAÇÃO DIRETA VPS (SEM HEALTH CHECK) ===');
    const vpsPayload = {
      instanceId: intelligentInstanceName,
      sessionName: intelligentInstanceName,
      webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
    };

    console.log('[DIRECT] Payload para VPS (FASE 2):', vpsPayload);

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE_DIRECT',
      action: 'Sending direct create request to VPS (FASE 2 - no health check)',
      status: 'start',
      data: { payload: vpsPayload }
    });

    const vpsData = await makeDirectVPSRequest('/instance/create', 'POST', vpsPayload);

    console.log('[DIRECT] ✅ Resposta da VPS (FASE 2):', vpsData);

    if (!vpsData.success) {
      throw new Error(vpsData.error || 'VPS retornou success: false');
    }

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE_DIRECT',
      action: 'FASE 2 VPS instance creation successful',
      status: 'success',
      data: { vpsInstanceId: vpsData.instanceId }
    });

    // FASE 2: SALVAR NO SUPABASE
    console.log('[DIRECT] === FASE 2: SALVAR NO SUPABASE ===');
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE_DIRECT',
      action: 'Saving FASE 2 instance to Supabase',
      status: 'start'
    });

    const instanceData = {
      instance_name: intelligentInstanceName,
      connection_type: 'web',
      server_url: VPS_CONFIG.baseUrl,
      vps_instance_id: vpsData.instanceId || intelligentInstanceName,
      web_status: 'initializing',
      connection_status: 'vps_created',
      created_by_user_id: user.id,
      company_id: null
    };
    
    console.log('[DIRECT] Dados para inserir no Supabase (FASE 2):', instanceData);

    const { data: newInstance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceData)
      .select()
      .single();

    if (dbError) {
      console.log('[DIRECT] Erro no banco (FASE 2):', dbError);
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'CREATE_INSTANCE_DIRECT',
        action: 'FASE 2 Database save failed',
        status: 'error',
        data: { error: dbError.message }
      });
      throw new Error(`Erro ao salvar instância no banco: ${dbError.message}`);
    }

    console.log('[DIRECT] ✅ Instância salva no banco (FASE 2):', newInstance);

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `FASE 2 Operation ${operationId} completed successfully`,
      status: 'success',
      data: { 
        instanceId: newInstance.id, 
        instanceName: newInstance.instance_name,
        phase: 'FASE_2_DIRECT_CREATION',
        userEmail: user.email,
        skipHealthCheck: true
      }
    });

    console.log('[DIRECT] === FASE 2 SUCESSO COMPLETO (SEM HEALTH CHECK) ===');
    console.log('[DIRECT] Nova instância criada diretamente:', newInstance.id);

    return new Response(JSON.stringify({
      success: true,
      instance: newInstance,
      vps_response: vpsData,
      user_id: user.id,
      operationId,
      phase: 'FASE_2_DIRECT_CREATION',
      intelligent_name: intelligentInstanceName,
      user_email: user.email,
      skip_health_check: true,
      message: 'Instância criada com sistema FASE 2 - criação direta sem health check'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log('[DIRECT] === ERRO NA CRIAÇÃO DIRETA (FASE 2) ===');
    console.log('[DIRECT] Erro:', error);
    console.log('[DIRECT] Stack:', error.stack);
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `FASE 2 Operation ${operationId} failed during direct creation`,
      status: 'error',
      data: { error: error.message, phase: 'FASE_2_DIRECT_CREATION' }
    });
    
    let errorMessage = error.message;
    let errorType = 'UNKNOWN_ERROR';
    
    if (error.name === 'AbortError' || error.message.includes('Timeout')) {
      errorMessage = 'FASE 2 - Timeout na criação direta da VPS';
      errorType = 'VPS_TIMEOUT_DIRECT';
    } else if (error.message.includes('HTTP')) {
      errorType = 'VPS_HTTP_ERROR_DIRECT';
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      errorType,
      operationId,
      action: 'create_instance',
      phase: 'FASE_2_DIRECT_CREATION',
      method: 'direct_edge_function_no_health_check',
      user_email: user?.email
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// FASE 2: FUNÇÃO DELETE DIRETA
async function deleteInstanceDirect(supabase: any, instanceId: string, user: any, operationId: string) {
  console.log('[DIRECT] === DELETAR INSTÂNCIA DIRETA (FASE 2) ===');
  console.log('[DIRECT] Instance ID:', instanceId);
  console.log('[DIRECT] User ID:', user.id);
  
  logStructured({
    timestamp: new Date().toISOString(),
    phase: 'DELETE_INSTANCE_DIRECT',
    action: `Starting FASE 2 direct instance deletion for ${instanceId}`,
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

    console.log('[DIRECT] Instância encontrada (FASE 2):', instance);

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'DELETE_INSTANCE_DIRECT',
      action: 'FASE 2 Instance found in database',
      status: 'success',
      data: { instanceName: instance.instance_name, vpsInstanceId: instance.vps_instance_id }
    });

    // Deletar da VPS se tiver vps_instance_id
    if (instance.vps_instance_id) {
      try {
        console.log('[DIRECT] Deletando da VPS (FASE 2):', instance.vps_instance_id);
        
        logStructured({
          timestamp: new Date().toISOString(),
          phase: 'DELETE_INSTANCE_DIRECT',
          action: 'FASE 2 Deleting from VPS directly',
          status: 'start'
        });
        
        await makeDirectVPSRequest(`/instance/${instance.vps_instance_id}`, 'DELETE', {});
        
        console.log('[DIRECT] ✅ Deletado da VPS com sucesso (FASE 2)');
        
        logStructured({
          timestamp: new Date().toISOString(),
          phase: 'DELETE_INSTANCE_DIRECT',
          action: 'FASE 2 VPS deletion successful',
          status: 'success'
        });
      } catch (vpsError) {
        console.log('[DIRECT] ⚠️ Erro ao deletar da VPS (FASE 2 - continuando):', vpsError);
        logStructured({
          timestamp: new Date().toISOString(),
          phase: 'DELETE_INSTANCE_DIRECT',
          action: 'FASE 2 VPS deletion failed but continuing',
          status: 'warning',
          data: { error: vpsError.message }
        });
      }
    }

    // Deletar do banco
    console.log('[DIRECT] Deletando do banco (FASE 2)...');
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(`Erro ao deletar instância do banco: ${deleteError.message}`);
    }

    console.log('[DIRECT] ✅ Deletado do banco com sucesso (FASE 2)');

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `FASE 2 Operation ${operationId} deletion completed successfully`,
      status: 'success'
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Instância deletada com sistema FASE 2 direto',
      operationId,
      user_id: user?.id,
      phase: 'FASE_2_DIRECT_DELETION'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log('[DIRECT] === ERRO NA DELEÇÃO DIRETA (FASE 2) ===');
    console.log('[DIRECT] Erro:', error);
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'OPERATION_END',
      action: `FASE 2 Operation ${operationId} deletion failed`,
      status: 'error',
      data: { error: error.message }
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      operationId,
      action: 'delete_instance',
      instanceId: instanceId,
      phase: 'FASE_2_DIRECT_DELETION'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
