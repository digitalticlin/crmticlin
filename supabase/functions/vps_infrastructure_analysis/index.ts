
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const VPS_CONFIG = {
  hostname: '31.97.24.222',
  username: 'root',
  timeout: 30000
};

interface AnalysisStep {
  id: string;
  name: string;
  command: string;
  description: string;
}

const ANALYSIS_STEPS: AnalysisStep[] = [
  // Sistema Básico
  {
    id: 'system_info',
    name: 'Informações do Sistema',
    command: 'uname -a && cat /etc/os-release && uptime && free -h && df -h',
    description: 'Informações básicas do sistema operacional e recursos'
  },
  
  // Node.js e NPM
  {
    id: 'node_version',
    name: 'Versão Node.js',
    command: 'node --version && npm --version',
    description: 'Versões do Node.js e NPM instaladas'
  },
  
  // PM2
  {
    id: 'pm2_status',
    name: 'Status PM2',
    command: 'pm2 --version && pm2 list && pm2 status',
    description: 'Status e processos gerenciados pelo PM2'
  },
  
  // Processos Ativos
  {
    id: 'active_processes',
    name: 'Processos Ativos',
    command: 'ps aux | grep -E "(node|pm2|whatsapp)" | grep -v grep',
    description: 'Processos Node.js e WhatsApp em execução'
  },
  
  // Portas em Uso
  {
    id: 'ports_in_use',
    name: 'Portas em Uso',
    command: 'netstat -tulpn | grep -E ":(80|3001|3002|3003|8080)" && ss -tulpn | grep -E ":(80|3001|3002|3003|8080)"',
    description: 'Portas relevantes em uso no sistema'
  },
  
  // Estrutura de Diretórios
  {
    id: 'directory_structure',
    name: 'Estrutura de Diretórios',
    command: 'ls -la /root/ && find /root -maxdepth 2 -type d -name "*whatsapp*" -o -name "*api*" -o -name "*server*" 2>/dev/null',
    description: 'Estrutura de diretórios do projeto'
  },
  
  // Arquivos JavaScript
  {
    id: 'javascript_files',
    name: 'Arquivos JavaScript',
    command: 'find /root -name "*.js" -type f 2>/dev/null | head -20',
    description: 'Arquivos JavaScript encontrados'
  },
  
  // Arquivos de Configuração
  {
    id: 'config_files',
    name: 'Arquivos de Configuração',
    command: 'find /root -name "package.json" -o -name ".env*" -o -name "config.*" 2>/dev/null',
    description: 'Arquivos de configuração encontrados'
  },
  
  // Variáveis de Ambiente
  {
    id: 'environment_vars',
    name: 'Variáveis de Ambiente',
    command: 'env | grep -i -E "(token|api|key|port|whatsapp)" || echo "Nenhuma variável relevante encontrada"',
    description: 'Variáveis de ambiente relevantes'
  },
  
  // Conteúdo de Arquivos .env
  {
    id: 'env_files_content',
    name: 'Conteúdo Arquivos .env',
    command: 'find /root -name ".env*" -exec echo "=== {} ===" \\; -exec cat {} \\; 2>/dev/null || echo "Nenhum arquivo .env encontrado"',
    description: 'Conteúdo dos arquivos .env'
  },
  
  // Package.json
  {
    id: 'package_json_content',
    name: 'Conteúdo package.json',
    command: 'find /root -name "package.json" -exec echo "=== {} ===" \\; -exec cat {} \\; 2>/dev/null | head -100',
    description: 'Conteúdo dos arquivos package.json'
  },
  
  // Logs PM2
  {
    id: 'pm2_logs',
    name: 'Logs PM2 Recentes',
    command: 'pm2 logs --lines 20 --nostream 2>/dev/null || echo "Nenhum log PM2 disponível"',
    description: 'Logs recentes dos processos PM2'
  },
  
  // Teste de Conectividade HTTP Local
  {
    id: 'local_http_test',
    name: 'Teste HTTP Local',
    command: 'curl -s -m 5 http://localhost:80/health || echo "PORTA 80 INACESSÍVEL"; curl -s -m 5 http://localhost:3001/health || echo "PORTA 3001 INACESSÍVEL"; curl -s -m 5 http://localhost:3002/health || echo "PORTA 3002 INACESSÍVEL"',
    description: 'Teste de conectividade HTTP nas portas principais'
  },
  
  // WhatsApp Web.js Dependencies
  {
    id: 'whatsapp_dependencies',
    name: 'Dependências WhatsApp',
    command: 'find /root -name "node_modules" -exec find {} -name "*whatsapp*" -type d \\; 2>/dev/null | head -10',
    description: 'Módulos WhatsApp instalados'
  },
  
  // Sessões WhatsApp
  {
    id: 'whatsapp_sessions',
    name: 'Sessões WhatsApp',
    command: 'find /root -name "*session*" -o -name "*auth*" -o -name "*.json" | grep -i whatsapp 2>/dev/null || echo "Nenhuma sessão encontrada"',
    description: 'Arquivos de sessão do WhatsApp'
  },
  
  // Análise de Código dos Servidores
  {
    id: 'server_code_analysis',
    name: 'Análise Código dos Servidores',
    command: 'find /root -name "server.js" -o -name "index.js" -o -name "app.js" | head -5 | while read file; do echo "=== $file ==="; head -30 "$file" 2>/dev/null; done',
    description: 'Primeiras linhas dos arquivos principais dos servidores'
  }
];

async function executeSSHCommand(command: string, description: string): Promise<{success: boolean, output: string, duration: number}> {
  console.log(`[SSH Analysis] Executando: ${description}`);
  
  const sshKey = Deno.env.get('VPS_SSH_PRIVATE_KEY');
  if (!sshKey) {
    throw new Error('Chave SSH privada não configurada nos secrets');
  }
  
  const startTime = Date.now();
  
  try {
    const formattedKey = sshKey.includes('-----BEGIN') ? sshKey : 
      `-----BEGIN OPENSSH PRIVATE KEY-----\n${sshKey}\n-----END OPENSSH PRIVATE KEY-----`;
    
    const sshArgs = [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', 'ConnectTimeout=30',
      '-o', 'BatchMode=yes',
      `${VPS_CONFIG.username}@${VPS_CONFIG.hostname}`,
      command
    ];
    
    const process = new Deno.Command('ssh', {
      args: sshArgs,
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'piped'
    });
    
    const child = process.spawn();
    
    const writer = child.stdin.getWriter();
    await writer.write(new TextEncoder().encode(formattedKey));
    await writer.close();
    
    const { code, stdout, stderr } = await child.output();
    const duration = Date.now() - startTime;
    
    const outputText = new TextDecoder().decode(stdout);
    const errorText = new TextDecoder().decode(stderr);
    
    return {
      success: code === 0,
      output: outputText || errorText || 'Comando executado sem saída',
      duration
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[SSH Analysis] Erro:`, error);
    
    return {
      success: false,
      output: `Erro na execução: ${error.message}`,
      duration
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[VPS Infrastructure Analysis] 🔍 Iniciando análise completa da infraestrutura');
    
    const results: any[] = [];
    let totalDuration = 0;
    
    // Executar cada etapa da análise
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
      total_steps: ANALYSIS_STEPS.length,
      successful_steps: results.filter(r => r.success).length,
      failed_steps: results.filter(r => !r.success).length,
      total_duration: totalDuration,
      analysis_timestamp: new Date().toISOString(),
      vps_hostname: VPS_CONFIG.hostname
    };
    
    console.log('[VPS Analysis] 📊 Análise completa finalizada:', summary);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Análise completa da infraestrutura VPS executada',
        summary,
        detailed_results: results
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('[VPS Infrastructure Analysis] ❌ Erro geral:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
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
