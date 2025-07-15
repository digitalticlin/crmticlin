import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  console.log(`🚀 [${executionId}] ESTRUTURA MODULAR - EDGE FUNCTION INICIADA`);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const body = await req.json();
    const { action, instanceName, instanceId } = body;

    console.log(`[${executionId}] Processando ação: ${action} para usuário: ${user.email}`);

    switch (action) {
      case 'create_instance':
        return await createInstanceModular(supabase, user, instanceName, executionId);
      case 'health_check':
        return await healthCheckModular(executionId);
      default:
        throw new Error(`Action não suportada: ${action}. Esta Edge Function é exclusiva para criar instâncias.`);
    }
  } catch (error) {
    console.error(`❌ [${executionId}] Erro na Edge Function:`, error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      executionId
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

async function createInstanceModular(supabase, user, instanceName, executionId) {
  try {
    console.log(`[${executionId}] 🚀 Criando instância modular: ${instanceName}`);
    
    // Gerar nome inteligente
    const intelligentName = await generateIntelligentName(supabase, user, instanceName);
    console.log(`[${executionId}] 🎯 Nome inteligente: ${intelligentName}`);

    // Tentar VPS
    const vpsResult = await attemptVPSCreation(intelligentName, executionId);
    
    if (vpsResult.success) {
      console.log(`[${executionId}] ✅ VPS Success`);
      // CORREÇÃO: Salvar com status "pending" ao invés de "connected"
      const instance = await saveInstanceToDatabase(supabase, user, intelligentName, 'pending', vpsResult.data);
      return createSuccessResponse(instance, vpsResult, intelligentName, user.email, false, executionId);
    } else {
      console.log(`[${executionId}] 🚨 VPS Fallback: ${vpsResult.error}`);
      // Criar instância apenas no banco (fallback)
      const instance = await saveInstanceToDatabase(supabase, user, intelligentName, 'pending');
      return createSuccessResponse(instance, vpsResult, intelligentName, user.email, true, executionId);
    }
  } catch (error) {
    console.error(`[${executionId}] ❌ Erro na criação:`, error.message);
    throw error;
  }
}

// Função getQRCodeModular removida - usar whatsapp_qr_manager para obter QR Code

async function healthCheckModular(executionId) {
  try {
    const vpsUrl = Deno.env.get('VPS_SERVER_URL') || 'http://31.97.163.57:3001';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${vpsUrl}/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const isHealthy = response.ok;

    return new Response(JSON.stringify({
      success: isHealthy,
      message: isHealthy ? 'VPS online' : 'VPS offline',
      executionId
    }), {
      status: isHealthy ? 200 : 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: `Health check falhou: ${error.message}`,
      executionId
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

async function attemptVPSCreation(instanceId, executionId) {
  try {
    console.log(`[${executionId}] 🌐 Criando na VPS: ${instanceId}`);
    
    // CORREÇÃO: Usar URL correta na porta 3001
    const vpsUrl = 'http://31.97.163.57:3001';
    const vpsToken = Deno.env.get('VPS_API_TOKEN') || 'bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${vpsUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vpsToken}`,
      },
      body: JSON.stringify({
        instanceId,
        webhookUrl: 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`VPS HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[${executionId}] ✅ VPS criada com sucesso`);

    return {
      success: true,
      data
    };
  } catch (error) {
    console.log(`[${executionId}] ❌ VPS falhou: ${error.message}`);
    return {
      success: false,
      error: `VPS_ERROR: ${error.message}`
    };
  }
}

async function generateIntelligentName(supabase, user, baseInstanceName) {
  try {
    const baseName = baseInstanceName || user.email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    
    const { data: existingInstances } = await supabase
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('created_by_user_id', user.id)
      .eq('connection_type', 'web');

    const existingNames = existingInstances?.map((i) => i.instance_name) || [];

    if (!existingNames.includes(baseName)) {
      return baseName;
    }

    let counter = 1;
    let candidateName = `${baseName}${counter}`;
    while (existingNames.includes(candidateName)) {
      counter++;
      candidateName = `${baseName}${counter}`;
    }

    return candidateName;
  } catch (error) {
    return `whatsapp_${Date.now()}`;
  }
}

async function saveInstanceToDatabase(supabase, user, instanceName, status, vpsData) {
  console.log(`[saveInstanceToDatabase] Iniciando salvamento para usuário: ${user.id}`);
  
  const instanceData = {
    instance_name: instanceName,
    connection_type: 'web',
    server_url: 'http://31.97.163.57:3001',
    vps_instance_id: instanceName,
    web_status: status === 'pending' ? 'pending' : 'fallback_created',
    connection_status: status,
    created_by_user_id: user.id,
    qr_code: vpsData?.qrCode || null
  };

  console.log(`[saveInstanceToDatabase] Dados da instância:`, JSON.stringify(instanceData, null, 2));

  const { data: instance, error } = await supabase
    .from('whatsapp_instances')
    .insert(instanceData)
    .select()
    .single();

  if (error) {
    console.error(`[saveInstanceToDatabase] Erro detalhado:`, error);
    throw new Error(`Erro ao salvar no banco: ${error.message} - Code: ${error.code} - Details: ${error.details}`);
  }

  console.log(`[saveInstanceToDatabase] Instância salva com sucesso:`, instance.id);
  return instance;
}

function createSuccessResponse(instance, vpsResult, intelligentName, userEmail, fallbackUsed, executionId) {
  return new Response(JSON.stringify({
    success: true,
    instance,
    vps_response: {
      success: vpsResult.success,
      instanceId: intelligentName,
      fallback: fallbackUsed,
      vpsError: vpsResult.error || null,
      mode: fallbackUsed ? 'database_only' : 'vps_connected'
    },
    user_id: instance.created_by_user_id,
    intelligent_name: intelligentName,
    user_email: userEmail,
    vps_success: vpsResult.success,
    fallback_used: fallbackUsed,
    mode: fallbackUsed ? 'database_only' : 'vps_connected',
    message: fallbackUsed ? 'Instância criada em modo fallback' : 'Instância criada com sucesso',
    executionId
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
} 