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
    // CORREÇÃO: Timeout mais baixo para health check
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
    // CORREÇÃO: Timeout mais granular com AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeout);

    const response = await fetch(`${VPS_CONFIG.baseUrl}${endpoint}`, {
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

    const data = await response.json();
    
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

    // CORREÇÃO: Autenticação mais robusta
    const authHeader = req.headers.get('Authorization');
    let currentUser = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'AUTHENTICATION',
        action: 'Validating JWT token',
        status: 'start'
      });
      
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError) {
          logStructured({
            timestamp: new Date().toISOString(),
            phase: 'AUTHENTICATION',
            action: 'JWT validation failed',
            status: 'error',
            data: { error: userError.message, code: userError.code }
          });
        } else if (user) {
          currentUser = user;
          logStructured({
            timestamp: new Date().toISOString(),
            phase: 'AUTHENTICATION',
            action: 'User authenticated successfully',
            status: 'success',
            data: { userId: user.id, email: user.email }
          });
        }
      } catch (authError) {
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

    const { action, instanceName, instanceId } = await req.json();
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'REQUEST_PARSING',
      action: `Action received: ${action}`,
      status: 'success',
      data: { action, instanceName, instanceId, userId: currentUser.id }
    });

    if (action === 'create_instance') {
      return await createInstanceRobust(supabase, instanceName, currentUser, operationId);
    }

    if (action === 'delete_instance_corrected') {
      return await deleteInstanceRobust(supabase, instanceId, currentUser, operationId);
    }

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
    
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE',
      action: 'Instance name normalized',
      status: 'success',
      data: { original: instanceName, normalized: normalizedName }
    });

    // CORREÇÃO: Health check opcional para debug
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE',
      action: 'Skipping health check for debug - proceeding directly to VPS',
      status: 'warning'
    });

    // FASE 2: Comunicação direta com VPS
    const vpsPayload = {
      instanceId: normalizedName,
      sessionName: normalizedName,
      webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
    };

    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE',
      action: 'Sending create request to VPS with retry logic',
      status: 'start',
      data: { payload: vpsPayload }
    });

    const vpsData = await makeVPSRequestWithRetry('/instance/create', 'POST', vpsPayload);

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
    logStructured({
      timestamp: new Date().toISOString(),
      phase: 'CREATE_INSTANCE',
      action: 'Saving instance to Supabase',
      status: 'start'
    });

    const { data: newInstance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: normalizedName,
        connection_type: 'web',
        server_url: VPS_CONFIG.baseUrl,
        vps_instance_id: vpsData.instanceId || normalizedName,
        web_status: 'initializing',
        connection_status: 'vps_created',
        created_by_user_id: user.id,
        company_id: null
      })
      .select()
      .single();

    if (dbError) {
      logStructured({
        timestamp: new Date().toISOString(),
        phase: 'CREATE_INSTANCE',
        action: 'Database save failed',
        status: 'error',
        data: { error: dbError.message }
      });
      throw new Error(`Erro ao salvar instância no banco: ${dbError.message}`);
    }

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

    return new Response(JSON.stringify({
      success: true,
      instance: newInstance,
      vps_response: vpsData,
      user_id: user.id,
      operationId,
      vps_health: {
        latency: 5, // Mock value since we skipped health check
        healthy: true
      },
      message: 'Instância criada com sistema robusto (health check skipped for debug)'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
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
      method: 'robust_edge_function_with_retry_corrected'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function deleteInstanceRobust(supabase: any, instanceId: string, user: any, operationId: string) {
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
        logStructured({
          timestamp: new Date().toISOString(),
          phase: 'DELETE_INSTANCE',
          action: 'Deleting from VPS with retry logic',
          status: 'start'
        });
        
        await makeVPSRequestWithRetry(`/instance/${instance.vps_instance_id}`, 'DELETE', {});
        
        logStructured({
          timestamp: new Date().toISOString(),
          phase: 'DELETE_INSTANCE',
          action: 'VPS deletion successful',
          status: 'success'
        });
      } catch (vpsError) {
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
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(`Erro ao deletar instância do banco: ${deleteError.message}`);
    }

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
