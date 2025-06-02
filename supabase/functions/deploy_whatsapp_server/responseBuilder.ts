
import { DeployResponse, ServiceStatus } from './types.ts';
import { corsHeaders } from './config.ts';

export const buildSuccessResponse = (
  vpsHost: string,
  apiPort: string,
  whatsappPort: string,
  apiResult: any,
  whatsappResult: any
): Response => {
  console.log('🎉 Ambos serviços estão funcionando perfeitamente!');
  
  const response: DeployResponse = {
    success: true,
    message: 'Servidores WhatsApp estão online e funcionando!',
    status: 'services_running',
    api_server_url: `http://${vpsHost}:${apiPort}`,
    whatsapp_server_url: `http://${vpsHost}:${whatsappPort}`,
    api_server_health: apiResult.data,
    whatsapp_server_health: whatsappResult.data,
    deploy_method: 'Verificação automática com retry',
    diagnostics: {
      vps_ping: true,
      api_server_running: true,
      whatsapp_server_running: true,
      pm2_running: true,
      services_accessible: true,
      api_attempts: apiResult.attempt,
      whatsapp_attempts: whatsappResult.attempt
    },
    next_steps: [
      'Os serviços estão funcionando corretamente',
      'Você pode começar a usar o WhatsApp Web.js',
      'Acesse http://31.97.24.222/health para verificar API',
      'Acesse http://31.97.24.222:3001/health para verificar WhatsApp'
    ]
  };

  return new Response(
    JSON.stringify(response),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
};

export const buildFailureResponse = (
  vpsHost: string,
  apiResult: any,
  whatsappResult: any,
  deployScript: string
): Response => {
  console.log('⚠️ Um ou mais serviços estão offline, fornecendo instruções otimizadas...');

  const currentStatus: ServiceStatus = {
    api_server: apiResult.online,
    whatsapp_server: whatsappResult.online,
    api_details: apiResult,
    whatsapp_details: whatsappResult,
    retry_info: {
      api_attempts: apiResult.attempt,
      whatsapp_attempts: whatsappResult.attempt,
      timeout_used: '15s',
      max_retries: 3
    }
  };

  const response: DeployResponse = {
    success: false,
    error: 'Um ou mais serviços estão offline após retry',
    message: 'Execute o script otimizado de ajuste via SSH',
    current_status: currentStatus,
    ssh_instructions: {
      step1: `Conecte na VPS: ssh root@${vpsHost}`,
      step2: 'Execute o script otimizado de ajuste fornecido abaixo',
      step3: 'Aguarde a verificação e ajustes automatizados (2-3 minutos)',
      step4: `Teste final: curl http://localhost:80/health && curl http://localhost:3001/health`
    },
    deploy_script: deployScript,
    improvements: {
      timeout_increased: '5s → 15s para maior tolerância de rede',
      retry_mechanism: 'Até 3 tentativas com delay de 2s entre elas',
      pm2_cleanup: 'Remove instâncias duplicadas antes de recriar',
      robust_testing: 'Verificação final com 5 tentativas e timeout de 10s',
      external_connectivity: 'Testa acessibilidade externa após configuração'
    },
    troubleshooting: {
      common_issues: [
        'Timeout de rede (resolvido com retry)',
        'Instâncias PM2 duplicadas (limpeza automática)',
        'Serviços não bindados em 0.0.0.0 (script corrige)',
        'Inicialização lenta dos serviços (aguarda com retry)'
      ],
      solutions: [
        'pm2 status (verificar instâncias após limpeza)',
        'pm2 logs vps-api-server (logs do API)',
        'pm2 logs whatsapp-server (logs do WhatsApp)',
        'netstat -tlnp | grep -E "(80|3001)" (verificar portas)'
      ]
    }
  };

  return new Response(
    JSON.stringify(response),
    { 
      status: 503, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
};

export const buildErrorResponse = (error: any): Response => {
  console.error('❌ Erro na verificação otimizada:', error);
  
  const response: DeployResponse = {
    success: false,
    error: error.message,
    message: 'Erro no sistema de verificação otimizado',
    improvements: [
      'Timeout aumentado para 15s',
      'Retry automático implementado',
      'Script de limpeza PM2 otimizado'
    ]
  };

  return new Response(
    JSON.stringify(response),
    { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
};
