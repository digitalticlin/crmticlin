
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface AnalysisStep {
  id: string;
  name: string;
  command: string;
  description: string;
}

const ANALYSIS_STEPS: AnalysisStep[] = [
  {
    id: 'system_info',
    name: 'Informações do Sistema',
    command: 'uname -a && uptime && free -h && df -h',
    description: 'Informações básicas do sistema operacional e recursos'
  },
  
  {
    id: 'node_version',
    name: 'Versão Node.js',
    command: 'node --version && npm --version && which node && which npm',
    description: 'Versões do Node.js e NPM instaladas'
  },
  
  {
    id: 'pm2_status',
    name: 'Status PM2',
    command: 'pm2 status && pm2 list',
    description: 'Status e processos gerenciados pelo PM2'
  },
  
  {
    id: 'active_processes',
    name: 'Processos Ativos',
    command: 'ps aux | grep -E "(node|whatsapp|server)" | grep -v grep',
    description: 'Processos Node.js e WhatsApp em execução'
  },
  
  {
    id: 'ports_in_use',
    name: 'Portas em Uso',
    command: 'netstat -tulpn | grep -E ":(3000|3001|3002|8080|8000)" || ss -tulpn | grep -E ":(3000|3001|3002|8080|8000)"',
    description: 'Portas relevantes em uso no sistema'
  },
  
  {
    id: 'directory_structure',
    name: 'Estrutura de Diretórios',
    command: 'ls -la /root/ && find /root -maxdepth 2 -type d 2>/dev/null',
    description: 'Estrutura de diretórios do projeto'
  },
  
  {
    id: 'js_files',
    name: 'Arquivos JavaScript',
    command: 'find /root -name "*.js" -type f 2>/dev/null | head -20',
    description: 'Arquivos JavaScript encontrados'
  },
  
  {
    id: 'config_files',
    name: 'Arquivos de Configuração',
    command: 'find /root -name "package.json" -o -name "*.env" -o -name "ecosystem.config.js" 2>/dev/null',
    description: 'Arquivos de configuração encontrados'
  },
  
  {
    id: 'env_vars',
    name: 'Variáveis de Ambiente',
    command: 'env | grep -E "(NODE|PORT|TOKEN|API)" | head -10',
    description: 'Variáveis de ambiente relevantes'
  },
  
  {
    id: 'env_files_content',
    name: 'Conteúdo Arquivos .env',
    command: 'find /root -name "*.env" -exec echo "=== {} ==="  \\; -exec head -10 {} \\; 2>/dev/null',
    description: 'Conteúdo dos arquivos .env'
  },
  
  {
    id: 'package_json_content',
    name: 'Conteúdo package.json',
    command: 'find /root -name "package.json" -exec echo "=== {} ===" \\; -exec cat {} \\; 2>/dev/null',
    description: 'Conteúdo dos arquivos package.json'
  },
  
  {
    id: 'pm2_logs',
    name: 'Logs PM2 Recentes',
    command: 'pm2 logs --lines 20 --nostream 2>/dev/null || echo "PM2 logs not available"',
    description: 'Logs recentes dos processos PM2'
  },
  
  {
    id: 'http_test',
    name: 'Teste HTTP Local',
    command: 'curl -s -w "Status: %{http_code}\\n" http://localhost:3001/health || curl -s -w "Status: %{http_code}\\n" http://localhost:3000/health || echo "HTTP test failed"',
    description: 'Teste de conectividade HTTP nas portas principais'
  },
  
  {
    id: 'whatsapp_dependencies',
    name: 'Dependências WhatsApp',
    command: 'find /root -name "node_modules" -exec ls {}/whatsapp-web.js 2>/dev/null \\; -quit || echo "WhatsApp Web.js not found"',
    description: 'Módulos WhatsApp instalados'
  },
  
  {
    id: 'whatsapp_sessions',
    name: 'Sessões WhatsApp',
    command: 'find /root -name ".wwebjs_*" -o -name "session*" 2>/dev/null | head -10',
    description: 'Arquivos de sessão do WhatsApp'
  },
  
  {
    id: 'server_files_analysis',
    name: 'Análise Código dos Servidores',
    command: 'find /root -name "*.js" -exec echo "=== {} ===" \\; -exec head -15 {} \\; 2>/dev/null | head -50',
    description: 'Primeiras linhas dos arquivos principais dos servidores'
  }
];

async function executeSSHCommand(command: string, description: string): Promise<{success: boolean, output: any, duration: number}> {
  console.log(`[SSH Analysis] Executando: ${description}`);
  
  const startTime = Date.now();
  
  try {
    // Usar o proxy Hostinger para executar comandos SSH
    const response = await fetch('https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/hostinger_proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        action: 'execute_command',
        command: command,
        description: description
      }),
      signal: AbortSignal.timeout(60000) // 60 segundos timeout
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`[SSH Analysis] ✅ ${description}: executado com sucesso`);
      
      return {
        success: data.success || false,
        output: data.output || data.result || data,
        duration
      };
    } else {
      const errorText = await response.text();
      console.log(`[SSH Analysis] ⚠️ ${description}: ${response.status} - ${errorText}`);
      
      return {
        success: false,
        output: {
          error: `HTTP ${response.status}`,
          message: errorText,
          proxy_error: true
        },
        duration
      };
    }
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[SSH Analysis] Erro: ${error}`);
    
    return {
      success: false,
      output: {
        error: 'SSH Connection Error',
        message: error.message,
        type: error.name
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
    console.log('[VPS Infrastructure Analysis] 🔍 Iniciando análise SSH da infraestrutura');
    
    const results: any[] = [];
    let totalDuration = 0;
    
    // Executar todos os passos de análise via SSH
    for (const step of ANALYSIS_STEPS) {
      console.log(`[VPS Analysis] 📋 Executando: ${step.name}`);
      
      const result = await executeSSHCommand(step.command, step.description);
      totalDuration += result.duration;
      
      results.push({
        id: step.id,
        name: step.name,
        description: step.description,
        command: step.command,
        success: result.success,
        output: result.output,
        duration: result.duration,
        timestamp: new Date().toISOString()
      });
      
      console.log(`[VPS Analysis] ${result.success ? '✅' : '❌'} ${step.name}: ${result.duration}ms`);
      
      // Pequeno delay entre comandos para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Análise resumida
    const summary = {
      total_steps: results.length,
      successful_steps: results.filter(r => r.success).length,
      failed_steps: results.filter(r => !r.success).length,
      total_duration: totalDuration,
      analysis_timestamp: new Date().toISOString(),
      analysis_method: 'SSH_COMMANDS',
      connectivity_status: results.filter(r => r.success).length > 0 ? 'PARTIAL' : 'FAILED'
    };
    
    console.log('[VPS Analysis] 📊 Análise SSH completa finalizada:', summary);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Análise SSH da infraestrutura VPS executada',
        summary,
        detailed_results: results,
        method: 'SSH Analysis via Hostinger Proxy'
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
        note: 'Análise SSH - usando proxy Hostinger'
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
