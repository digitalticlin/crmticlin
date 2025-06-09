
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  host: '31.97.24.222',
  user: 'root',
  ports: [3001, 3002, 22, 80, 443, 8080],
  whatsappPorts: [3001, 3002]
};

// IPs conhecidos do Supabase que precisam ter acesso
const SUPABASE_IP_RANGES = [
  '54.94.20.247',     // IP atual detectado
  '54.94.0.0/16',     // Range AWS South America
  '52.67.0.0/16',     // Range AWS South America
  '18.228.0.0/16',    // Range AWS South America
  '0.0.0.0/0'         // Temporário para teste - REMOVER após confirmar IPs específicos
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    const correctionId = `firewall_fix_${Date.now()}`;
    
    console.log(`[VPS Firewall Corrector] 🔥 INICIANDO CORREÇÃO: ${action} [${correctionId}]`);

    let result: any = {};

    switch (action) {
      case 'check_firewall_status':
        result = await checkFirewallStatus(correctionId);
        break;
      case 'configure_firewall':
        result = await configureFirewall(correctionId);
        break;
      case 'emergency_open_all':
        result = await emergencyOpenAll(correctionId);
        break;
      case 'whitelist_supabase_ips':
        result = await whitelistSupabaseIPs(correctionId);
        break;
      default:
        result = await runCompleteFirewallFix(correctionId);
    }

    return new Response(JSON.stringify({
      success: true,
      correctionId,
      action,
      result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[VPS Firewall Corrector] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function executeSSHCommand(command: string, description: string): Promise<any> {
  console.log(`[SSH] 🔧 ${description}: ${command.substring(0, 100)}...`);
  
  const sshKey = Deno.env.get('VPS_SSH_PRIVATE_KEY');
  if (!sshKey) {
    throw new Error('VPS_SSH_PRIVATE_KEY não configurada nos secrets do Supabase');
  }

  try {
    // Criar arquivo temporário para chave SSH
    const tempKeyFile = `/tmp/vps_key_${Date.now()}`;
    await Deno.writeTextFile(tempKeyFile, sshKey);
    await Deno.chmod(tempKeyFile, 0o600);

    const sshCommand = [
      'ssh',
      '-i', tempKeyFile,
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', 'ConnectTimeout=30',
      '-o', 'BatchMode=yes',
      `${VPS_CONFIG.user}@${VPS_CONFIG.host}`,
      command
    ];

    const process = new Deno.Command('ssh', {
      args: sshCommand.slice(1),
      stdout: 'piped',
      stderr: 'piped'
    });

    const { code, stdout, stderr } = await process.output();
    const output = new TextDecoder().decode(stdout);
    const error = new TextDecoder().decode(stderr);

    // Limpar arquivo temporário
    try {
      await Deno.remove(tempKeyFile);
    } catch (e) {
      console.log('[SSH] Aviso: não foi possível remover arquivo temporário');
    }

    console.log(`[SSH] Exit code: ${code}, Output: ${output.substring(0, 200)}`);
    
    return {
      success: code === 0,
      output: output || error,
      exitCode: code,
      command: description
    };

  } catch (error) {
    console.error(`[SSH] Erro na execução:`, error);
    throw new Error(`Falha SSH: ${error.message}`);
  }
}

async function checkFirewallStatus(correctionId: string) {
  console.log(`[Firewall Check] 🔍 Verificando status do firewall [${correctionId}]`);
  
  const checks = [];
  
  // Verificar se UFW está ativo
  const ufwStatus = await executeSSHCommand('ufw status verbose', 'Verificar status UFW');
  checks.push({
    test: 'UFW Status',
    result: ufwStatus,
    active: ufwStatus.output.includes('Status: active')
  });

  // Verificar regras do iptables
  const iptablesRules = await executeSSHCommand('iptables -L -n', 'Verificar regras iptables');
  checks.push({
    test: 'iptables Rules',
    result: iptablesRules,
    hasRules: iptablesRules.output.length > 100
  });

  // Verificar portas em uso
  const portsInUse = await executeSSHCommand('netstat -tlnp | grep -E ":3001|:3002|:22|:80"', 'Verificar portas em uso');
  checks.push({
    test: 'Ports in Use',
    result: portsInUse,
    whatsappPortsActive: portsInUse.output.includes(':3001') || portsInUse.output.includes(':3002')
  });

  // Testar conectividade local das portas WhatsApp
  for (const port of VPS_CONFIG.whatsappPorts) {
    const localTest = await executeSSHCommand(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/health || echo "FAILED"`, `Teste local porta ${port}`);
    checks.push({
      test: `Local Port ${port} Test`,
      result: localTest,
      accessible: localTest.output.includes('200') || localTest.output.includes('404')
    });
  }

  return {
    test: 'firewall_status_check',
    checks,
    summary: {
      ufwActive: checks[0]?.active || false,
      hasIptablesRules: checks[1]?.hasRules || false,
      whatsappRunning: checks[2]?.whatsappPortsActive || false,
      portsAccessible: checks.filter(c => c.test.includes('Local Port') && c.accessible).length
    }
  };
}

async function configureFirewall(correctionId: string) {
  console.log(`[Firewall Config] ⚙️ Configurando firewall [${correctionId}]`);
  
  const commands = [];
  
  // 1. Resetar UFW
  commands.push(await executeSSHCommand('ufw --force reset', 'Resetar UFW'));
  
  // 2. Configurar política padrão
  commands.push(await executeSSHCommand('ufw default deny incoming', 'Política padrão - deny incoming'));
  commands.push(await executeSSHCommand('ufw default allow outgoing', 'Política padrão - allow outgoing'));
  
  // 3. Liberar porta SSH primeiro (crítico)
  commands.push(await executeSSHCommand('ufw allow 22/tcp', 'Liberar SSH (22)'));
  
  // 4. Liberar portas WhatsApp
  for (const port of VPS_CONFIG.whatsappPorts) {
    commands.push(await executeSSHCommand(`ufw allow ${port}/tcp`, `Liberar porta WhatsApp ${port}`));
  }
  
  // 5. Liberar portas web padrão
  commands.push(await executeSSHCommand('ufw allow 80/tcp', 'Liberar HTTP (80)'));
  commands.push(await executeSSHCommand('ufw allow 443/tcp', 'Liberar HTTPS (443)'));
  
  // 6. Ativar UFW
  commands.push(await executeSSHCommand('ufw --force enable', 'Ativar UFW'));
  
  // 7. Verificar status final
  const finalStatus = await executeSSHCommand('ufw status numbered', 'Status final UFW');
  commands.push(finalStatus);

  return {
    test: 'firewall_configuration',
    commands,
    success: commands.every(cmd => cmd.success),
    finalStatus: finalStatus.output
  };
}

async function whitelistSupabaseIPs(correctionId: string) {
  console.log(`[IP Whitelist] 🏢 Configurando whitelist Supabase IPs [${correctionId}]`);
  
  const commands = [];
  
  // Liberar IPs específicos do Supabase para as portas WhatsApp
  for (const ipRange of SUPABASE_IP_RANGES) {
    for (const port of VPS_CONFIG.whatsappPorts) {
      const command = `ufw allow from ${ipRange} to any port ${port}`;
      commands.push(await executeSSHCommand(command, `Whitelist ${ipRange} para porta ${port}`));
    }
  }

  // Verificar regras aplicadas
  const rulesCheck = await executeSSHCommand('ufw status numbered', 'Verificar regras aplicadas');
  commands.push(rulesCheck);

  return {
    test: 'supabase_ip_whitelist',
    ipRanges: SUPABASE_IP_RANGES,
    ports: VPS_CONFIG.whatsappPorts,
    commands,
    success: commands.filter(cmd => cmd.success).length >= SUPABASE_IP_RANGES.length * VPS_CONFIG.whatsappPorts.length,
    finalRules: rulesCheck.output
  };
}

async function emergencyOpenAll(correctionId: string) {
  console.log(`[Emergency] 🚨 ABERTURA EMERGENCIAL - todas as portas [${correctionId}]`);
  
  const commands = [];
  
  // Desativar UFW temporariamente
  commands.push(await executeSSHCommand('ufw --force disable', 'Desativar UFW temporariamente'));
  
  // Limpar todas as regras iptables
  commands.push(await executeSSHCommand('iptables -F', 'Limpar regras iptables'));
  commands.push(await executeSSHCommand('iptables -X', 'Limpar chains iptables'));
  commands.push(await executeSSHCommand('iptables -t nat -F', 'Limpar NAT iptables'));
  commands.push(await executeSSHCommand('iptables -t nat -X', 'Limpar NAT chains'));
  
  // Política ACCEPT para tudo (TEMPORÁRIO)
  commands.push(await executeSSHCommand('iptables -P INPUT ACCEPT', 'Política INPUT ACCEPT'));
  commands.push(await executeSSHCommand('iptables -P FORWARD ACCEPT', 'Política FORWARD ACCEPT'));
  commands.push(await executeSSHCommand('iptables -P OUTPUT ACCEPT', 'Política OUTPUT ACCEPT'));
  
  // Verificar se funcionou
  const testConnection = await executeSSHCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health || echo "STILL_FAILED"', 'Teste pós abertura');
  commands.push(testConnection);

  return {
    test: 'emergency_open_all',
    warning: 'ATENÇÃO: Todas as portas foram abertas temporariamente para teste',
    commands,
    success: commands.every(cmd => cmd.success),
    connectionTest: testConnection.output
  };
}

async function runCompleteFirewallFix(correctionId: string) {
  console.log(`[Complete Fix] 🔥 CORREÇÃO COMPLETA DO FIREWALL [${correctionId}]`);
  
  // Etapa 1: Verificar status atual
  const status = await checkFirewallStatus(correctionId);
  
  // Etapa 2: Configurar firewall corretamente
  const config = await configureFirewall(correctionId);
  
  // Etapa 3: Whitelist IPs Supabase
  const whitelist = await whitelistSupabaseIPs(correctionId);
  
  // Etapa 4: Teste final
  const finalTest = await executeSSHCommand('ufw status verbose', 'Verificação final');
  
  return {
    comprehensive: true,
    steps: {
      status,
      config,
      whitelist,
      finalTest
    },
    analysis: {
      firewallConfigured: config.success,
      ipsWhitelisted: whitelist.success,
      ready: config.success && whitelist.success
    },
    recommendations: generateFirewallRecommendations(status, config, whitelist)
  };
}

function generateFirewallRecommendations(status: any, config: any, whitelist: any): string[] {
  const recommendations = [];
  
  if (!config.success) {
    recommendations.push('🔥 CRÍTICO: Falha na configuração do firewall - verificar conexão SSH');
    recommendations.push('🔥 CRÍTICO: Executar configuração manual via SSH se necessário');
  }
  
  if (!whitelist.success) {
    recommendations.push('🏢 SUPABASE: Falha no whitelist de IPs - tentar com ranges maiores');
    recommendations.push('🏢 SUPABASE: Considerar liberação temporária para todos os IPs');
  }
  
  if (config.success && whitelist.success) {
    recommendations.push('✅ FIREWALL: Configuração aplicada com sucesso');
    recommendations.push('🧪 TESTE: Executar teste de conectividade novamente');
    recommendations.push('🔒 SEGURANÇA: Monitorar logs de acesso');
  }
  
  recommendations.push('⚡ PRÓXIMO: Executar diagnóstico de rede novamente para confirmar');
  
  return recommendations;
}
