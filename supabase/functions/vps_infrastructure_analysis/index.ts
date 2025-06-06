
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const VPS_CONFIG = {
  hostname: '31.97.24.222',
  port: '3001',
  get baseUrl() {
    return `http://${this.hostname}:${this.port}`;
  },
  authToken: 'default-token',
  timeout: 30000
};

interface AnalysisStep {
  id: string;
  name: string;
  endpoint: string;
  description: string;
}

const ANALYSIS_STEPS: AnalysisStep[] = [
  // Testes HTTP para VPS
  {
    id: 'vps_health',
    name: 'Status da VPS',
    endpoint: '/health',
    description: 'Verificar se a VPS está respondendo'
  },
  
  {
    id: 'vps_instances',
    name: 'Instâncias WhatsApp',
    endpoint: '/instances',
    description: 'Listar instâncias WhatsApp ativas'
  },
  
  {
    id: 'server_info',
    name: 'Informações do Servidor',
    endpoint: '/server/info',
    description: 'Informações detalhadas do servidor'
  },
  
  {
    id: 'system_status',
    name: 'Status do Sistema',
    endpoint: '/system/status',
    description: 'Status dos serviços do sistema'
  },
  
  {
    id: 'node_version',
    name: 'Versão Node.js',
    endpoint: '/system/node-version',
    description: 'Verificar versão do Node.js'
  },
  
  {
    id: 'pm2_status',
    name: 'Status PM2',
    endpoint: '/system/pm2-status',
    description: 'Status dos processos PM2'
  },
  
  {
    id: 'ports_check',
    name: 'Verificação de Portas',
    endpoint: '/system/ports',
    description: 'Verificar portas em uso'
  },
  
  {
    id: 'whatsapp_config',
    name: 'Configuração WhatsApp',
    endpoint: '/config/whatsapp',
    description: 'Verificar configuração do WhatsApp Web.js'
  }
];

async function executeHTTPTest(endpoint: string, description: string): Promise<{success: boolean, output: any, duration: number}> {
  console.log(`[VPS Analysis] 🌐 Testando: ${description}`);
  
  const startTime = Date.now();
  
  try {
    const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
    console.log(`[VPS Analysis] 📡 Fazendo requisição para: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'User-Agent': 'Supabase-VPS-Analysis/1.0'
      },
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`[VPS Analysis] ✅ ${description}: ${response.status}`);
      
      return {
        success: true,
        output: data,
        duration
      };
    } else {
      const errorText = await response.text();
      console.log(`[VPS Analysis] ⚠️ ${description}: ${response.status} - ${errorText}`);
      
      return {
        success: false,
        output: {
          error: `HTTP ${response.status}`,
          message: errorText,
          url: url
        },
        duration
      };
    }
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[VPS Analysis] ❌ Erro em ${description}:`, error);
    
    return {
      success: false,
      output: {
        error: 'Connection Error',
        message: error.message,
        type: error.name
      },
      duration
    };
  }
}

// Função para testes básicos quando endpoints específicos não existem
async function executeBasicConnectivityTest(): Promise<{success: boolean, output: any, duration: number}> {
  const startTime = Date.now();
  
  try {
    // Testar conectividade básica
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      signal: AbortSignal.timeout(10000)
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        output: {
          status: 'VPS Online',
          version: data.version || 'unknown',
          timestamp: data.timestamp || new Date().toISOString(),
          connectivity: 'OK'
        },
        duration
      };
    } else {
      return {
        success: false,
        output: {
          error: `HTTP ${response.status}`,
          message: 'VPS não está respondendo adequadamente'
        },
        duration
      };
    }
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      output: {
        error: 'Connection Failed',
        message: `Não foi possível conectar à VPS: ${error.message}`,
        vps_host: VPS_CONFIG.hostname,
        vps_port: VPS_CONFIG.port
      },
      duration
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[VPS Infrastructure Analysis] 🔍 Iniciando análise HTTP da infraestrutura');
    
    const results: any[] = [];
    let totalDuration = 0;
    
    // Primeiro, testar conectividade básica
    console.log('[VPS Analysis] 🔌 Testando conectividade básica...');
    const basicTest = await executeBasicConnectivityTest();
    totalDuration += basicTest.duration;
    
    results.push({
      id: 'basic_connectivity',
      name: 'Conectividade Básica',
      description: 'Teste de conectividade HTTP com a VPS',
      success: basicTest.success,
      output: basicTest.output,
      duration: basicTest.duration,
      timestamp: new Date().toISOString()
    });
    
    // Se a conectividade básica falhou, ainda assim continuar com outros testes
    if (basicTest.success) {
      console.log('[VPS Analysis] ✅ Conectividade básica OK, continuando com testes específicos...');
    } else {
      console.log('[VPS Analysis] ⚠️ Conectividade básica falhou, mas continuando com outros testes...');
    }
    
    // Executar testes específicos
    for (const step of ANALYSIS_STEPS) {
      console.log(`[VPS Analysis] 📋 Executando: ${step.name}`);
      
      const result = await executeHTTPTest(step.endpoint, step.description);
      totalDuration += result.duration;
      
      results.push({
        id: step.id,
        name: step.name,
        description: step.description,
        endpoint: step.endpoint,
        success: result.success,
        output: result.output,
        duration: result.duration,
        timestamp: new Date().toISOString()
      });
      
      console.log(`[VPS Analysis] ${result.success ? '✅' : '❌'} ${step.name}: ${result.duration}ms`);
      
      // Pequeno delay entre requisições
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Análise resumida
    const summary = {
      total_steps: results.length,
      successful_steps: results.filter(r => r.success).length,
      failed_steps: results.filter(r => !r.success).length,
      total_duration: totalDuration,
      analysis_timestamp: new Date().toISOString(),
      vps_hostname: VPS_CONFIG.hostname,
      analysis_method: 'HTTP_REQUESTS',
      connectivity_status: basicTest.success ? 'ONLINE' : 'OFFLINE'
    };
    
    console.log('[VPS Analysis] 📊 Análise HTTP completa finalizada:', summary);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Análise HTTP da infraestrutura VPS executada',
        summary,
        detailed_results: results,
        method: 'HTTP Analysis (Supabase Edge Compatible)'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('[VPS Infrastructure Analysis] ❌ Erro geral:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        note: 'Análise HTTP - compatível com Supabase Edge Runtime'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
