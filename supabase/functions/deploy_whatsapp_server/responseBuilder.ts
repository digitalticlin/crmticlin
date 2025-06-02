
import { DeployResponse, ServiceStatus } from './types.ts';
import { corsHeaders } from './config.ts';

export const buildSuccessResponse = (
  vpsHost: string,
  apiPort: string,
  whatsappPort: string,
  apiResult: any,
  whatsappResult: any
): Response => {
  console.log('🎉 Ambos serviços funcionando com verificação inteligente!');
  
  const response: DeployResponse = {
    success: true,
    message: 'Servidores WhatsApp estão online e funcionando!',
    status: 'services_running',
    api_server_url: `http://${vpsHost}:${apiPort}`,
    whatsapp_server_url: `http://${vpsHost}:${whatsappPort}`,
    api_server_health: apiResult.data,
    whatsapp_server_health: whatsappResult.data,
    deploy_method: 'Verificação inteligente com múltiplos endpoints',
    diagnostics: {
      vps_ping: true,
      api_server_running: true,
      whatsapp_server_running: true,
      pm2_running: true,
      services_accessible: true,
      api_attempts: apiResult.attempt,
      whatsapp_attempts: whatsappResult.attempt,
      intelligent_check: true
    },
    next_steps: [
      'Os serviços estão funcionando corretamente',
      'Verificação com múltiplos endpoints bem-sucedida',
      `Acesse http://${vpsHost}:${apiPort}/status para API`,
      `Acesse http://${vpsHost}:${whatsappPort}/health para WhatsApp`
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
  deployScript: string,
  specificInstructions?: any
): Response => {
  console.log('⚠️ Problemas detectados, fornecendo soluções específicas...');

  const currentStatus: ServiceStatus = {
    api_server: apiResult.online,
    whatsapp_server: whatsappResult.online,
    api_details: apiResult,
    whatsapp_details: whatsappResult,
    retry_info: {
      api_attempts: apiResult.attempt,
      whatsapp_attempts: whatsappResult.attempt,
      timeout_used: '8s',
      max_retries: 'múltiplos endpoints'
    }
  };

  const response: DeployResponse = {
    success: false,
    error: 'Um ou mais serviços precisam de ajustes',
    message: 'Execute as correções específicas via SSH',
    current_status: currentStatus,
    ssh_instructions: specificInstructions || {
      step1: `Conecte na VPS: ssh root@${vpsHost}`,
      step2: 'Execute o script de correção fornecido',
      step3: 'Aguarde verificação automatizada (2-3 minutos)',
      step4: `Teste: curl http://localhost:80/health && curl http://localhost:3001/health`
    },
    deploy_script: deployScript,
    improvements: {
      intelligent_endpoints: 'Testa múltiplos endpoints (/health, /status, /, /instances)',
      faster_timeout: 'Timeout reduzido para 8s para detecção mais rápida',
      specific_diagnosis: 'Diagnóstico específico baseado no que está funcionando',
      targeted_solutions: 'Soluções direcionadas ao problema identificado'
    },
    troubleshooting: {
      api_server_issues: [
        'Se API offline: verificar PM2 status e logs',
        'Se endpoint não responde: verificar firewall porta 80',
        'Se timeout: verificar conectividade VPS'
      ],
      whatsapp_server_issues: [
        'Se WhatsApp offline: verificar se existe diretório /root/whatsapp-*',
        'Se porta 3001 não responde: verificar se servidor foi iniciado',
        'Se endpoint /health não existe: implementar endpoint básico',
        'Se processo não encontrado: iniciar via PM2'
      ],
      diagnostic_commands: [
        'pm2 status (verificar processos)',
        'sudo netstat -tlnp | grep -E "(80|3001)" (verificar portas)',
        'ps aux | grep node (verificar processos Node.js)',
        'ls -la /root/ | grep whatsapp (verificar diretórios)'
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
  console.error('❌ Erro na verificação inteligente:', error);
  
  const response: DeployResponse = {
    success: false,
    error: error.message,
    message: 'Erro no sistema de verificação inteligente',
    improvements: [
      'Verificação com múltiplos endpoints implementada',
      'Timeout otimizado para 8s',
      'Diagnóstico específico por serviço',
      'Soluções direcionadas ao problema'
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
