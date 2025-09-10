import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VPSConfig {
  baseUrl: string;
  authToken: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Secure WhatsApp Service] 🔐 Processando requisição segura...');
    
    // Get VPS configuration from secrets - SECURITY FIX
    const vpsToken = Deno.env.get('VPS_API_TOKEN');
    if (!vpsToken) {
      console.error('[Secure WhatsApp Service] ❌ VPS_API_TOKEN não configurado');
      throw new Error('VPS token não configurado');
    }

    const vpsConfig: VPSConfig = {
      baseUrl: 'http://31.97.163.57:3001',
      authToken: vpsToken
    };

    // Parse request body with input validation
    const requestBody = await req.json();
    const { action, instanceId, ...params } = requestBody;
    
    // Input validation
    if (!action || typeof action !== 'string') {
      throw new Error('Action é obrigatória e deve ser uma string');
    }
    
    if (action !== 'list_instances' && action !== 'health_check' && action !== 'test_connectivity' && 
        action !== 'test_auth' && action !== 'test_server_process' && action !== 'count_instances') {
      if (!instanceId || typeof instanceId !== 'string') {
        throw new Error('instanceId é obrigatório para esta ação');
      }
    }
    
    console.log('[Secure WhatsApp Service] 📝 Ação solicitada:', action);

    // Validate user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    // Initialize Supabase client with service role for validation
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate user session
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Token de autorização inválido');
    }

    // Verify user role for admin operations
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      throw new Error('Permissões insuficientes para esta operação');
    }

    console.log('[Secure WhatsApp Service] ✅ Usuário autenticado e autorizado:', user.id);

    let result;

    switch (action) {
      case 'list_instances':
        result = await listInstances(vpsConfig);
        break;
      
      case 'get_instance_status':
        if (!instanceId) throw new Error('instanceId é obrigatório');
        result = await getInstanceStatus(vpsConfig, instanceId);
        break;
      
      case 'health_check':
        result = await performHealthCheck(vpsConfig);
        break;
      
      case 'test_connectivity':
        result = await testConnectivity(vpsConfig);
        break;
      
      case 'test_auth':
        result = await testAuthentication(vpsConfig);
        break;
      
      case 'test_server_process':
        result = await testServerProcess(vpsConfig);
        break;
      
      case 'count_instances':
        result = await countInstances(vpsConfig);
        break;
      
      default:
        throw new Error(`Ação não suportada: ${action}`);
    }

    console.log('[Secure WhatsApp Service] ✅ Operação concluída com sucesso');
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('[Secure WhatsApp Service] ❌ Erro:', error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

async function listInstances(config: VPSConfig) {
  const response = await fetch(`${config.baseUrl}/instances`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.authToken}`
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`VPS request failed: ${response.status}`);
  }

  const data = await response.json();
  return { instances: data.instances || [] };
}

async function getInstanceStatus(config: VPSConfig, instanceId: string) {
  // Input sanitization
  const sanitizedId = instanceId.replace(/[^a-zA-Z0-9_-]/g, '');
  
  const response = await fetch(`${config.baseUrl}/instance/${sanitizedId}/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.authToken}`
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`Status check failed: ${response.status}`);
  }

  const data = await response.json();
  return { status: data.status };
}

async function performHealthCheck(config: VPSConfig) {
  const healthCheck = {
    success: false,
    status: 'unknown',
    connectivity: false,
    authentication: false,
    serverProcess: false,
    instanceCount: 0,
    errors: [],
    recommendations: []
  };

  try {
    // Test connectivity
    const connectivityTest = await testConnectivity(config);
    healthCheck.connectivity = connectivityTest.success;
    
    if (!connectivityTest.success) {
      healthCheck.errors.push(`Conectividade falhou: ${connectivityTest.error}`);
      healthCheck.recommendations.push('Verificar se a VPS está online e acessível');
      return { healthCheck };
    }

    // Test authentication
    const authTest = await testAuthentication(config);
    healthCheck.authentication = authTest.success;
    
    if (!authTest.success) {
      healthCheck.errors.push(`Autenticação falhou: ${authTest.error}`);
      healthCheck.recommendations.push('Verificar token de autenticação VPS_API_TOKEN');
    }

    // Test server process
    const processTest = await testServerProcess(config);
    healthCheck.serverProcess = processTest.success;
    
    if (!processTest.success) {
      healthCheck.errors.push(`Processo do servidor: ${processTest.error}`);
      healthCheck.recommendations.push('Verificar se whatsapp-server.js está rodando na VPS');
    }

    // Count instances
    if (healthCheck.authentication && healthCheck.serverProcess) {
      const instancesTest = await countInstances(config);
      healthCheck.instanceCount = instancesTest.count;
      
      if (instancesTest.count === 0) {
        healthCheck.recommendations.push('Nenhuma instância ativa encontrada - possível perda após restart');
      }
    }

    // Determine overall status
    if (healthCheck.connectivity && healthCheck.authentication && healthCheck.serverProcess) {
      healthCheck.success = true;
      healthCheck.status = 'healthy';
    } else if (healthCheck.connectivity) {
      healthCheck.status = 'partial';
    } else {
      healthCheck.status = 'offline';
    }

    return { healthCheck };
  } catch (error) {
    healthCheck.errors.push(`Erro inesperado: ${error.message}`);
    healthCheck.status = 'error';
    return { healthCheck };
  }
}

async function testConnectivity(config: VPSConfig) {
  try {
    const response = await fetch(`${config.baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });

    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testAuthentication(config: VPSConfig) {
  try {
    const response = await fetch(`${config.baseUrl}/instances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.authToken}`
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.status === 401) {
      return {
        success: false,
        error: 'Token de autenticação inválido'
      };
    }

    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testServerProcess(config: VPSConfig) {
  try {
    const response = await fetch(`${config.baseUrl}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.authToken}`
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: data.status === 'online',
        error: data.status !== 'online' ? `Status: ${data.status}` : undefined
      };
    }

    return {
      success: false,
      error: `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function countInstances(config: VPSConfig) {
  try {
    const response = await fetch(`${config.baseUrl}/instances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.authToken}`
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        count: data.instances?.length || 0
      };
    }

    return {
      count: 0,
      error: `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      count: 0,
      error: error.message
    };
  }
}
