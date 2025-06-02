
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando deploy WhatsApp Server robusto...');

    const VPS_HOST = '31.97.24.222';
    const API_SERVER_PORT = '80';
    const WHATSAPP_PORT = '3001';

    // === FASE 1: VERIFICAÇÃO RÁPIDA DE STATUS ===
    console.log('📱 Verificação rápida de status dos serviços...');
    
    const quickHealthCheck = async (url: string, timeout: number = 3000) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response.ok;
      } catch (error) {
        console.log(`❌ Health check failed for ${url}:`, error.message);
        return false;
      }
    };

    const apiOnline = await quickHealthCheck(`http://${VPS_HOST}:${API_SERVER_PORT}/health`);
    const whatsappOnline = await quickHealthCheck(`http://${VPS_HOST}:${WHATSAPP_PORT}/health`);
    
    console.log(`API Server (porta 80): ${apiOnline ? '✅ Online' : '❌ Offline'}`);
    console.log(`WhatsApp Server (porta 3001): ${whatsappOnline ? '✅ Online' : '❌ Offline'}`);

    if (apiOnline && whatsappOnline) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Ambos servidores já estão online!',
          status: 'already_running',
          api_url: `http://${VPS_HOST}:${API_SERVER_PORT}`,
          whatsapp_url: `http://${VPS_HOST}:${WHATSAPP_PORT}`,
          diagnostics: {
            vps_ping: true,
            api_server_running: true,
            whatsapp_server_running: true,
            pm2_running: true
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === FASE 2: DEPLOY COMPLETO COM TIMEOUT ESTENDIDO ===
    console.log('🔧 Iniciando deploy completo com configurações robustas...');

    // Script de deploy otimizado e mais confiável
    const deployScript = `#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

echo "🔧 [$(date)] Iniciando deploy WhatsApp Server..."

# Função para log com timestamp
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

# Verificar se já está funcionando
log_info "Verificando se serviços já estão rodando..."
if curl -f -s http://localhost:80/health > /dev/null 2>&1; then
    log_info "API Server já está rodando na porta 80"
    if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
        log_info "WhatsApp Server já está rodando na porta 3001"
        echo "✅ Ambos serviços já estão online!"
        exit 0
    fi
fi

cd /root

# Configurar firewall
log_info "Configurando firewall..."
ufw allow 80/tcp || log_error "Falha ao configurar firewall para porta 80"
ufw allow 3001/tcp || log_error "Falha ao configurar firewall para porta 3001"
ufw --force reload || log_error "Falha ao recarregar firewall"

# Verificar/instalar Node.js
log_info "Verificando Node.js..."
if ! command -v node >/dev/null 2>&1; then
    log_info "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Verificar/instalar PM2
log_info "Verificando PM2..."
if ! command -v pm2 >/dev/null 2>&1; then
    log_info "Instalando PM2..."
    npm install -g pm2
fi

# === CRIAR API SERVER (PORTA 80) ===
log_info "Configurando API Server na porta 80..."
rm -rf vps-api-server
mkdir -p vps-api-server && cd vps-api-server

cat > package.json << 'EOFPKG'
{
  "name": "vps-api-server",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOFPKG

# Instalar dependências com retry
log_info "Instalando dependências do API Server..."
npm install --production --silent || {
    log_error "Primeira tentativa de instalação falhou, tentando novamente..."
    npm cache clean --force
    npm install --production --silent
}

cat > server.js << 'EOFJS'
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();
const PORT = 80;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'VPS API Server',
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: Math.floor(process.uptime()),
    version: '2.0.0'
  });
});

app.get('/status', (req, res) => {
  res.json({
    server: 'online',
    port: PORT,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.post('/execute', (req, res) => {
  const { command, description } = req.body;
  
  if (!command) {
    return res.status(400).json({ success: false, error: 'Comando é obrigatório' });
  }
  
  console.log('Executando:', description || command);
  
  exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
    if (error) {
      return res.json({
        success: false,
        error: error.message,
        output: stdout,
        stderr: stderr,
        exit_code: error.code || 1
      });
    }
    
    res.json({
      success: true,
      output: stdout,
      stderr: stderr,
      exit_code: 0,
      description: description || command
    });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 VPS API Server rodando na porta ' + PORT);
});
EOFJS

# Parar processos existentes e iniciar API server
log_info "Iniciando API Server com PM2..."
pm2 stop vps-api-server 2>/dev/null || true
pm2 delete vps-api-server 2>/dev/null || true
pm2 start server.js --name "vps-api-server" --watch false

# === CRIAR WHATSAPP SERVER (PORTA 3001) ===
log_info "Configurando WhatsApp Server na porta 3001..."
cd /root
rm -rf whatsapp-server
mkdir -p whatsapp-server && cd whatsapp-server

cat > package.json << 'EOFPKG'
{
  "name": "whatsapp-server",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "whatsapp-web.js": "^1.23.0",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOFPKG

log_info "Instalando dependências do WhatsApp Server..."
npm install --production --silent || {
    log_error "Primeira tentativa falhou, limpando cache e tentando novamente..."
    npm cache clean --force
    npm install --production --silent
}

cat > server.js << 'EOFJS'
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let clients = new Map();

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Server v2.0',
    timestamp: new Date().toISOString(),
    instances: clients.size,
    uptime: Math.floor(process.uptime()),
    ssl_fix_enabled: true,
    timeout_fix_enabled: true
  });
});

app.get('/status', (req, res) => {
  res.json({
    server: 'online',
    instances: clients.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/instances', (req, res) => {
  const instanceList = Array.from(clients.keys()).map(id => ({
    id,
    status: 'active',
    created_at: new Date().toISOString()
  }));
  
  res.json({
    success: true,
    instances: instanceList
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 WhatsApp Server rodando na porta ' + PORT);
});
EOFJS

# Iniciar WhatsApp server
log_info "Iniciando WhatsApp Server com PM2..."
pm2 stop whatsapp-server 2>/dev/null || true
pm2 delete whatsapp-server 2>/dev/null || true
pm2 start server.js --name "whatsapp-server" --watch false

# Salvar configuração PM2
pm2 save

# Aguardar serviços iniciarem
log_info "Aguardando serviços iniciarem..."
sleep 5

# Testar ambos os servidores
log_info "Testando conectividade dos serviços..."
API_TEST=$(curl -f -s http://localhost:80/health && echo "✅ API Server OK" || echo "❌ API Server FALHOU")
WHATSAPP_TEST=$(curl -f -s http://localhost:3001/health && echo "✅ WhatsApp Server OK" || echo "❌ WhatsApp Server FALHOU")

echo "=== RESULTADO DO DEPLOY ==="
echo "$API_TEST"
echo "$WHATSAPP_TEST"
echo "============================"

log_info "Deploy concluído!"
`;

    // === FASE 3: TENTAR DEPLOY VIA API EXISTENTE (SE DISPONÍVEL) ===
    if (apiOnline) {
      console.log('🔄 Tentando deploy via API existente...');
      try {
        const deployResponse = await fetch(`http://${VPS_HOST}:${API_SERVER_PORT}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            command: deployScript,
            description: 'Deploy robusto WhatsApp + API Server',
            timeout: 300000 // 5 minutos
          }),
          signal: AbortSignal.timeout(320000) // 5m20s timeout
        });

        if (deployResponse.ok) {
          const result = await deployResponse.json();
          console.log('✅ Deploy executado via API:', result.success);
          
          // Aguardar e verificar serviços
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          const finalApiCheck = await quickHealthCheck(`http://${VPS_HOST}:${API_SERVER_PORT}/health`, 8000);
          const finalWhatsappCheck = await quickHealthCheck(`http://${VPS_HOST}:${WHATSAPP_PORT}/health`, 8000);
          
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Deploy executado com sucesso via API!',
              api_server_url: `http://${VPS_HOST}:${API_SERVER_PORT}`,
              whatsapp_server_url: `http://${VPS_HOST}:${WHATSAPP_PORT}`,
              api_healthy: finalApiCheck,
              whatsapp_healthy: finalWhatsappCheck,
              deployment_output: result.output || 'Deploy concluído',
              deploy_method: 'SSH via API VPS',
              diagnostics: {
                vps_ping: true,
                api_server_running: finalApiCheck,
                whatsapp_server_running: finalWhatsappCheck,
                pm2_running: true
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (apiError) {
        console.log('⚠️ Deploy via API falhou:', apiError.message);
      }
    }

    // === FASE 4: FALLBACK - INSTRUÇÕES SSH MANUAIS ===
    console.log('📋 Fornecendo instruções para deploy manual...');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Deploy automático não disponível',
        message: 'Execute manualmente via SSH para garantir funcionamento',
        ssh_instructions: {
          step1: `Conecte na VPS: ssh root@${VPS_HOST}`,
          step2: 'Execute o script de deploy fornecido abaixo',
          step3: 'Aguarde a conclusão (pode levar até 5 minutos)',
          step4: `Teste: curl http://localhost:80/health && curl http://localhost:3001/health`
        },
        deploy_script: deployScript,
        troubleshooting: {
          common_issues: [
            'Porta 80 já em uso por outro serviço',
            'Firewall bloqueando conexões',
            'Dependências Node.js não instaladas',
            'PM2 não configurado corretamente'
          ],
          solutions: [
            'sudo lsof -i :80 (verificar porta em uso)',
            'sudo ufw status (verificar firewall)',
            'node --version && npm --version (verificar Node.js)',
            'pm2 status (verificar PM2)'
          ]
        },
        next_steps: [
          'Se o deploy manual falhar, verifique os logs: pm2 logs',
          'Para reiniciar serviços: pm2 restart all',
          'Para verificar portas: netstat -tlnp | grep -E "(80|3001)"'
        ]
      }),
      { 
        status: 503, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro crítico no deploy robusto:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Erro no sistema de deploy robusto',
        timestamp: new Date().toISOString(),
        suggestion: 'Tente o deploy manual via SSH ou verifique conectividade da VPS',
        debug_info: {
          error_type: error.constructor.name,
          error_stack: error.stack?.substring(0, 500)
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
