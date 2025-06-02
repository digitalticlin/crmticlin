
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Verificando status dos serviços WhatsApp...');

    const VPS_HOST = '31.97.24.222';
    const API_SERVER_PORT = '80';
    const WHATSAPP_PORT = '3001';

    // === VERIFICAÇÃO OTIMIZADA DE STATUS ===
    console.log('📡 Testando conectividade dos serviços...');
    
    const quickHealthCheck = async (url: string, timeout: number = 5000) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'CRM-Deploy-Checker/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          return { online: true, data };
        }
        
        return { online: false, status: response.status };
      } catch (error) {
        console.log(`❌ Health check failed for ${url}:`, error.message);
        return { online: false, error: error.message };
      }
    };

    // Testar API Server (porta 80)
    const apiResult = await quickHealthCheck(`http://${VPS_HOST}:${API_SERVER_PORT}/health`);
    console.log(`API Server (porta 80): ${apiResult.online ? '✅ Online' : '❌ Offline'}`);
    
    // Testar WhatsApp Server (porta 3001) 
    const whatsappResult = await quickHealthCheck(`http://${VPS_HOST}:${WHATSAPP_PORT}/health`);
    console.log(`WhatsApp Server (porta 3001): ${whatsappResult.online ? '✅ Online' : '❌ Offline'}`);

    // === AMBOS SERVIÇOS ONLINE - SUCESSO! ===
    if (apiResult.online && whatsappResult.online) {
      console.log('🎉 Ambos serviços estão funcionando perfeitamente!');
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Servidores WhatsApp estão online e funcionando!',
          status: 'services_running',
          api_server_url: `http://${VPS_HOST}:${API_SERVER_PORT}`,
          whatsapp_server_url: `http://${VPS_HOST}:${WHATSAPP_PORT}`,
          api_server_health: apiResult.data,
          whatsapp_server_health: whatsappResult.data,
          deploy_method: 'Manual SSH (já executado)',
          diagnostics: {
            vps_ping: true,
            api_server_running: true,
            whatsapp_server_running: true,
            pm2_running: true,
            services_accessible: true
          },
          next_steps: [
            'Os serviços estão funcionando corretamente',
            'Você pode começar a usar o WhatsApp Web.js',
            'Acesse http://31.97.24.222/health para verificar API',
            'Acesse http://31.97.24.222:3001/health para verificar WhatsApp'
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === UM OU AMBOS SERVIÇOS OFFLINE ===
    console.log('⚠️ Um ou mais serviços estão offline, fornecendo instruções...');

    const deployScript = `#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

echo "🔧 [$(date)] Verificando e ajustando serviços WhatsApp..."

# Função para log com timestamp
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1"
}

# Verificar se PM2 está instalado
if ! command -v pm2 >/dev/null 2>&1; then
    log_info "Instalando PM2..."
    npm install -g pm2
fi

# Verificar status atual dos serviços
log_info "Verificando status atual..."
pm2 status

# === AJUSTAR API SERVER (PORTA 80) ===
if ! curl -f -s http://localhost:80/health > /dev/null 2>&1; then
    log_info "API Server offline - reiniciando..."
    cd /root/vps-api-server
    pm2 restart vps-api-server || pm2 start server.js --name "vps-api-server" --watch false
else
    log_info "API Server já está funcionando na porta 80"
fi

# === AJUSTAR WHATSAPP SERVER (PORTA 3001) ===
if ! curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
    log_info "WhatsApp Server offline - reiniciando..."
    cd /root/whatsapp-server  
    pm2 restart whatsapp-server || pm2 start server.js --name "whatsapp-server" --watch false
else
    log_info "WhatsApp Server já está funcionando na porta 3001"
fi

# Salvar configuração PM2
pm2 save

# Aguardar e testar
sleep 3
log_info "Testando serviços após ajustes..."
API_TEST=$(curl -f -s http://localhost:80/health && echo "✅ API Server OK" || echo "❌ API Server FALHOU")
WHATSAPP_TEST=$(curl -f -s http://localhost:3001/health && echo "✅ WhatsApp Server OK" || echo "❌ WhatsApp Server FALHOU")

echo "=== RESULTADO DOS AJUSTES ==="
echo "$API_TEST"
echo "$WHATSAPP_TEST"
pm2 status
echo "============================="

log_info "Ajustes concluídos!"
`;

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Um ou mais serviços estão offline',
        message: 'Execute o script de ajuste via SSH',
        current_status: {
          api_server: apiResult.online ? 'online' : 'offline',
          whatsapp_server: whatsappResult.online ? 'online' : 'offline',
          api_details: apiResult,
          whatsapp_details: whatsappResult
        },
        ssh_instructions: {
          step1: `Conecte na VPS: ssh root@${VPS_HOST}`,
          step2: 'Execute o script de ajuste fornecido abaixo',
          step3: 'Aguarde a verificação e ajustes (1-2 minutos)',
          step4: `Teste: curl http://localhost:80/health && curl http://localhost:3001/health`
        },
        deploy_script: deployScript,
        troubleshooting: {
          common_issues: [
            'Conflitos entre múltiplas instâncias PM2',
            'Portas ocupadas por outros processos',
            'Serviços travados ou com erro',
            'Configuração PM2 não salva'
          ],
          solutions: [
            'pm2 status (verificar instâncias)',
            'pm2 logs (verificar erros)',
            'pm2 restart all (reiniciar tudo)',
            'sudo lsof -i :80 -i :3001 (verificar portas)'
          ]
        }
      }),
      { 
        status: 503, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Erro no sistema de verificação',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
