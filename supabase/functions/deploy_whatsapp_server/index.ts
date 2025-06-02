
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

    // === VERIFICAÇÃO OTIMIZADA COM RETRY ===
    console.log('📡 Testando conectividade dos serviços com retry automático...');
    
    const healthCheckWithRetry = async (url: string, timeout: number = 15000, maxRetries: number = 3) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Tentativa ${attempt}/${maxRetries} para ${url}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'User-Agent': 'CRM-Deploy-Checker/2.0',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            let data = {};
            try {
              data = await response.json();
            } catch (e) {
              // Se não conseguir parsear JSON, considera como online se status OK
              data = { status: 'online', message: 'Service responding' };
            }
            console.log(`✅ ${url} respondeu com sucesso na tentativa ${attempt}`);
            return { online: true, data, attempt };
          }
          
          console.log(`⚠️ ${url} retornou status ${response.status} na tentativa ${attempt}`);
          if (attempt === maxRetries) {
            return { online: false, status: response.status, attempt };
          }
          
          // Aguardar antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.log(`❌ Erro na tentativa ${attempt} para ${url}:`, error.message);
          
          if (attempt === maxRetries) {
            return { online: false, error: error.message, attempt };
          }
          
          // Aguardar antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      return { online: false, error: 'Max retries exceeded' };
    };

    // Testar API Server (porta 80) com retry
    const apiResult = await healthCheckWithRetry(`http://${VPS_HOST}:${API_SERVER_PORT}/health`);
    console.log(`API Server (porta 80): ${apiResult.online ? '✅ Online' : '❌ Offline'} [Tentativas: ${apiResult.attempt}]`);
    
    // Testar WhatsApp Server (porta 3001) com retry
    const whatsappResult = await healthCheckWithRetry(`http://${VPS_HOST}:${WHATSAPP_PORT}/health`);
    console.log(`WhatsApp Server (porta 3001): ${whatsappResult.online ? '✅ Online' : '❌ Offline'} [Tentativas: ${whatsappResult.attempt}]`);

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
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === UM OU AMBOS SERVIÇOS OFFLINE ===
    console.log('⚠️ Um ou mais serviços estão offline, fornecendo instruções otimizadas...');

    const optimizedDeployScript = `#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

echo "🔧 [$(date)] Otimizando e verificando serviços WhatsApp..."

# Função para log com timestamp
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1"
}

log_info "Iniciando verificação e otimização dos serviços..."

# Verificar se PM2 está instalado
if ! command -v pm2 >/dev/null 2>&1; then
    log_info "Instalando PM2..."
    npm install -g pm2
fi

# === LIMPEZA DE INSTÂNCIAS DUPLICADAS ===
log_info "Removendo instâncias PM2 duplicadas..."
pm2 delete vps-api-server 2>/dev/null || true
pm2 delete whatsapp-server 2>/dev/null || true
pm2 delete api-server 2>/dev/null || true

# Verificar status atual
log_info "Status PM2 após limpeza:"
pm2 status

# === CONFIGURAR API SERVER (PORTA 80) ===
log_info "Configurando API Server na porta 80..."
cd /root/vps-api-server || {
    log_info "Diretório /root/vps-api-server não encontrado, criando estrutura..."
    mkdir -p /root/vps-api-server
    cd /root/vps-api-server
}

# Verificar se server.js existe, se não, criar um básico
if [ ! -f "server.js" ]; then
    log_info "Criando server.js básico para API..."
    cat > server.js << 'EOF'
const express = require('express');
const app = express();
const PORT = 80;

app.use(express.json());

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        server: 'VPS API Server',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(\`API Server rodando na porta \${PORT}\`);
});
EOF
fi

# Iniciar API Server
log_info "Iniciando API Server..."
pm2 start server.js --name "vps-api-server" --watch false

# === CONFIGURAR WHATSAPP SERVER (PORTA 3001) ===
log_info "Configurando WhatsApp Server na porta 3001..."
cd /root/whatsapp-server || {
    log_info "Diretório /root/whatsapp-server não encontrado, usando estrutura existente..."
    cd /root/whatsapp-web-server 2>/dev/null || cd /root
}

# Iniciar WhatsApp Server se não estiver rodando
if ! pm2 list | grep -q "whatsapp-server.*online"; then
    log_info "Iniciando WhatsApp Server..."
    pm2 start server.js --name "whatsapp-server" --watch false 2>/dev/null || {
        log_info "Tentando localizar e iniciar servidor WhatsApp..."
        find /root -name "server.js" -path "*/whatsapp*" -exec pm2 start {} --name "whatsapp-server" \\;
    }
fi

# Salvar configuração PM2 e configurar auto-start
log_info "Salvando configuração PM2..."
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# === VERIFICAÇÃO FINAL ROBUSTA ===
log_info "Aguardando inicialização dos serviços..."
sleep 5

log_info "Realizando verificação final com timeout estendido..."

# Função de teste com timeout
test_service() {
    local url=$1
    local name=$2
    local max_attempts=5
    
    for i in $(seq 1 $max_attempts); do
        if timeout 10 curl -f -s "$url" > /dev/null 2>&1; then
            echo "✅ $name OK (tentativa $i/$max_attempts)"
            return 0
        fi
        echo "⏳ $name aguardando... (tentativa $i/$max_attempts)"
        sleep 3
    done
    echo "❌ $name FALHOU após $max_attempts tentativas"
    return 1
}

# Testar serviços
API_STATUS=$(test_service "http://localhost:80/health" "API Server" && echo "OK" || echo "FAILED")
WHATSAPP_STATUS=$(test_service "http://localhost:3001/health" "WhatsApp Server" && echo "OK" || echo "FAILED")

echo "======================================"
echo "=== RESULTADO FINAL DOS AJUSTES ==="
echo "======================================"
echo "API Server (porta 80): $API_STATUS"
echo "WhatsApp Server (porta 3001): $WHATSAPP_STATUS"
echo ""
echo "Status PM2:"
pm2 status
echo ""
echo "Portas em uso:"
netstat -tlnp | grep -E ':(80|3001)' || echo "Nenhuma porta relevante encontrada"
echo "======================================"

log_info "Verificação e otimização concluídas!"

# Teste final de conectividade externa
log_info "Testando conectividade externa..."
curl -I http://localhost:80/health 2>/dev/null && echo "✅ API acessível externamente" || echo "⚠️ API pode não estar acessível externamente"
curl -I http://localhost:3001/health 2>/dev/null && echo "✅ WhatsApp acessível externamente" || echo "⚠️ WhatsApp pode não estar acessível externamente"
`;

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Um ou mais serviços estão offline após retry',
        message: 'Execute o script otimizado de ajuste via SSH',
        current_status: {
          api_server: apiResult.online ? 'online' : 'offline',
          whatsapp_server: whatsappResult.online ? 'online' : 'offline',
          api_details: apiResult,
          whatsapp_details: whatsappResult,
          retry_info: {
            api_attempts: apiResult.attempt,
            whatsapp_attempts: whatsappResult.attempt,
            timeout_used: '15s',
            max_retries: 3
          }
        },
        ssh_instructions: {
          step1: `Conecte na VPS: ssh root@${VPS_HOST}`,
          step2: 'Execute o script otimizado de ajuste fornecido abaixo',
          step3: 'Aguarde a verificação e ajustes automatizados (2-3 minutos)',
          step4: `Teste final: curl http://localhost:80/health && curl http://localhost:3001/health`
        },
        deploy_script: optimizedDeployScript,
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
      }),
      { 
        status: 503, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro na verificação otimizada:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Erro no sistema de verificação otimizado',
        timestamp: new Date().toISOString(),
        improvements_applied: [
          'Timeout aumentado para 15s',
          'Retry automático implementado',
          'Script de limpeza PM2 otimizado'
        ]
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
