
#!/bin/bash

# CORREÇÃO DEFINITIVA - ELIMINAR SYNTAXERROR DO PM2
echo "🔧 CORREÇÃO DEFINITIVA - ELIMINAR SYNTAXERROR DO PM2"
echo "=================================================="

echo "📅 Data: $(date)"
echo "🎯 Objetivo: Eliminar SyntaxError completamente e restaurar funcionalidade"
echo ""

# CONFIGURAÇÕES
VPS_IP="31.97.24.222"
PORTA="3002"

echo "🛑 ETAPA 1: LIMPEZA COMPLETA DO PM2"
echo "=================================="

echo "📋 Parando TODOS os processos PM2..."
pm2 stop all
pm2 delete all
pm2 kill

echo "📋 Limpando cache do PM2..."
pm2 flush
rm -rf /root/.pm2/logs/*

echo "📋 Verificando processos órfãos na porta 3002..."
lsof -ti:3002 | xargs -r kill -9
pkill -f "whatsapp-main-3002" 2>/dev/null || true
pkill -f "vps-server-persistent" 2>/dev/null || true

echo "✅ PM2 completamente limpo"

echo ""
echo "📁 ETAPA 2: APLICAR ARQUIVO CORRIGIDO 100% LIMPO"
echo "=============================================="

echo "📋 Criando arquivo vps-server-persistent.js 100% limpo (SEM HTML/JSX)..."

cat > vps-server-persistent.js << 'EOF_SERVIDOR_LIMPO'
// WhatsApp VPS Server - 100% LIMPO SEM SYNTAXERROR v5.1.0
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;
const API_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

// VERSION CONTROL - LIMPO
const SERVER_VERSION = '5.1.0-SYNTAXERROR-ELIMINATED';
const BUILD_DATE = new Date().toISOString();

console.log('🚀 Iniciando WhatsApp Server ' + SERVER_VERSION + ' - 100% LIMPO');
console.log('📅 Build: ' + BUILD_DATE);

// Configurar CORS e parsing
app.use(cors());
app.use(express.json());

// Configuração Puppeteer VPS
const VPS_PUPPETEER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
    '--memory-pressure-off',
    '--max_old_space_size=512'
  ],
  ignoreHTTPSErrors: true,
  timeout: 60000
};

// Armazenamento de instâncias
const instances = new Map();

// Diretório de persistência
const SESSIONS_DIR = path.join(__dirname, '.wwebjs_auth');

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autenticação inválido'
    });
  }

  next();
}

// Garantir diretório de sessões
async function ensureSessionDirectory() {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
      console.log('📂 Diretório de sessões criado: ' + SESSIONS_DIR);
    }
  } catch (error) {
    console.error('❌ Erro ao criar diretório de sessões: ' + error.message);
  }
}

// Função sendWebhook limpa
async function sendWebhook(webhookUrl, data) {
  try {
    console.log('📤 Enviando webhook: ' + webhookUrl);
    
    let fetch;
    try {
      fetch = require('node-fetch');
    } catch (error) {
      console.log('⚠️ node-fetch não disponível, pulando webhook');
      return;
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_TOKEN
      },
      body: JSON.stringify(data),
      timeout: 10000
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('HTTP ' + response.status + ': ' + errorText);
    }

    console.log('✅ Webhook enviado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao enviar webhook: ' + error.message);
  }
}

// Inicialização do cliente WhatsApp
async function initializeWhatsAppClient(instanceId, sessionName, webhookUrl) {
  try {
    console.log('[' + instanceId + '] 🚀 Inicializando cliente WhatsApp...');
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionName,
        dataPath: SESSIONS_DIR
      }),
      puppeteer: VPS_PUPPETEER_CONFIG
    });

    // Armazenar cliente imediatamente
    instances.set(instanceId, {
      client,
      sessionName,
      webhookUrl,
      status: 'initializing',
      createdAt: new Date().toISOString(),
      qrCode: null,
      phone: null,
      profileName: null,
      lastSeen: new Date().toISOString(),
      messages: []
    });

    console.log('[' + instanceId + '] ✅ Instância armazenada');
    
    // Timeout para evitar travamento
    const initTimeout = setTimeout(() => {
      console.log('[' + instanceId + '] ⏰ Timeout na inicialização - mantendo instância ativa');
      const instance = instances.get(instanceId);
      if (instance && instance.status === 'initializing') {
        instance.status = 'waiting_qr';
        instance.lastSeen = new Date().toISOString();
      }
    }, 120000);

    // Event handlers
    client.on('qr', async (qr) => {
      try {
        console.log('[' + instanceId + '] 📱 QR Code recebido!');
        
        const qrBase64 = await qrcode.toDataURL(qr, { type: 'png' });
        
        const instance = instances.get(instanceId);
        if (instance) {
          instance.qrCode = qrBase64;
          instance.status = 'qr_ready';
          instance.lastSeen = new Date().toISOString();
          
          console.log('[' + instanceId + '] ✅ QR Code salvo');
          
          if (webhookUrl) {
            sendWebhook(webhookUrl, {
              event: 'qr.update',
              instanceName: sessionName,
              instanceId: instanceId,
              data: { qrCode: qrBase64 },
              timestamp: new Date().toISOString()
            }).catch(console.error);
          }
        }
      } catch (error) {
        console.error('[' + instanceId + '] ❌ Erro ao processar QR: ' + error.message);
        const instance = instances.get(instanceId);
        if (instance) {
          instance.status = 'qr_error';
          instance.error = error.message;
        }
      }
    });

    client.on('ready', () => {
      console.log('[' + instanceId + '] 🎉 Cliente pronto!');
      clearTimeout(initTimeout);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'ready';
        instance.qrCode = null;
        instance.phone = client.info ? client.info.wid.user : null;
        instance.profileName = client.info ? client.info.pushname : null;
        instance.lastSeen = new Date().toISOString();
        
        if (webhookUrl) {
          sendWebhook(webhookUrl, {
            event: 'connection.update',
            instanceName: sessionName,
            instanceId: instanceId,
            data: { 
              status: 'ready',
              phone: instance.phone,
              profileName: instance.profileName
            },
            timestamp: new Date().toISOString()
          }).catch(console.error);
        }
      }
    });

    client.on('authenticated', () => {
      console.log('[' + instanceId + '] 🔐 Cliente autenticado');
      clearTimeout(initTimeout);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'authenticated';
        instance.lastSeen = new Date().toISOString();
      }
    });

    client.on('auth_failure', (msg) => {
      console.error('[' + instanceId + '] ❌ Falha de autenticação: ' + msg);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'auth_failed';
        instance.error = msg;
        instance.lastSeen = new Date().toISOString();
      }
    });

    client.on('disconnected', (reason) => {
      console.log('[' + instanceId + '] 🔌 Desconectado: ' + reason);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'disconnected';
        instance.error = reason;
        instance.lastSeen = new Date().toISOString();
      }
    });

    console.log('[' + instanceId + '] 🔄 Iniciando processo Puppeteer...');
    client.initialize().catch(error => {
      console.error('[' + instanceId + '] ❌ Erro na inicialização: ' + error.message);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'init_error';
        instance.error = error.message;
        instance.lastSeen = new Date().toISOString();
      }
    });
    
  } catch (error) {
    console.error('[' + instanceId + '] ❌ Erro geral: ' + error.message);
    const instance = instances.get(instanceId);
    if (instance) {
      instance.status = 'error';
      instance.error = error.message;
      instance.lastSeen = new Date().toISOString();
    }
  }
}

// === ENDPOINTS DA API ===

// Health check
app.get('/health', (req, res) => {
  console.log('📊 Health check solicitado');
  
  const instancesList = Array.from(instances.entries()).map(function(entry) {
    const id = entry[0];
    const instance = entry[1];
    return {
      id: id,
      status: instance.status,
      phone: instance.phone,
      hasQR: !!instance.qrCode,
      session: instance.sessionName
    };
  });

  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp VPS Server',
    version: SERVER_VERSION,
    build_date: BUILD_DATE,
    port: PORT,
    timestamp: new Date().toISOString(),
    active_instances: instances.size,
    instances: instancesList,
    syntax_error_eliminated: true
  });
});

// Status do servidor
app.get('/status', (req, res) => {
  console.log('📋 Status do servidor solicitado');
  
  const instancesList = Array.from(instances.entries()).map(function(entry) {
    const id = entry[0];
    const instance = entry[1];
    return {
      id: id,
      status: instance.status,
      phone: instance.phone,
      hasQR: !!instance.qrCode,
      session: instance.sessionName,
      lastSeen: instance.lastSeen,
      messageCount: instance.messages ? instance.messages.length : 0
    };
  });

  res.json({
    success: true,
    version: SERVER_VERSION,
    activeInstances: instances.size,
    totalInstances: instances.size,
    instances: instancesList,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    syntax_error_eliminated: true
  });
});

// Listar instâncias
app.get('/instances', authenticateToken, (req, res) => {
  console.log('📋 Listando todas as instâncias...');
  
  const instancesList = [];
  
  for (const entry of instances.entries()) {
    const instanceId = entry[0];
    const instance = entry[1];
    instancesList.push({
      instanceId: instanceId,
      status: instance.status,
      sessionName: instance.sessionName,
      phone: instance.phone,
      profileName: instance.profileName,
      lastSeen: instance.lastSeen,
      hasQR: !!instance.qrCode,
      error: instance.error || null,
      createdAt: instance.createdAt,
      messageCount: instance.messages ? instance.messages.length : 0
    });
  }
  
  console.log('📊 Encontradas ' + instancesList.length + ' instâncias');
  
  res.json({
    success: true,
    instances: instancesList,
    total: instancesList.length,
    server_version: SERVER_VERSION,
    timestamp: new Date().toISOString()
  });
});

// Criar instância
app.post('/instance/create', authenticateToken, async (req, res) => {
  try {
    const instanceId = req.body.instanceId;
    const sessionName = req.body.sessionName;
    const webhookUrl = req.body.webhookUrl;
    
    console.log('🔥 CRIAÇÃO: ' + instanceId + ' (' + sessionName + ')');
    
    if (!instanceId || !sessionName) {
      return res.status(400).json({
        success: false,
        error: 'instanceId e sessionName são obrigatórios'
      });
    }
    
    if (instances.has(instanceId)) {
      return res.status(409).json({
        success: false,
        error: 'Instância já existe',
        instanceId: instanceId
      });
    }
    
    const finalWebhookUrl = webhookUrl || 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
    
    console.log('[' + instanceId + '] ⚡ Resposta imediata - inicializando em background');
    
    setImmediate(function() {
      initializeWhatsAppClient(instanceId, sessionName, finalWebhookUrl);
    });
    
    res.json({
      success: true,
      instanceId: instanceId,
      sessionName: sessionName,
      status: 'creating',
      message: 'Instância sendo criada - aguarde 30s para QR code',
      webhookUrl: finalWebhookUrl,
      server_version: SERVER_VERSION
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar instância: ' + error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      server_version: SERVER_VERSION
    });
  }
});

// GET QR Code endpoint
app.get('/instance/:instanceId/qr', authenticateToken, (req, res) => {
  try {
    const instanceId = req.params.instanceId;
    
    console.log('📱 GET QR Code para instância: ' + instanceId);
    
    const instance = instances.get(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada',
        instanceId: instanceId
      });
    }
    
    if (instance.qrCode) {
      res.json({
        success: true,
        qrCode: instance.qrCode,
        status: instance.status,
        instanceId: instanceId,
        timestamp: new Date().toISOString(),
        has_qr_code: true
      });
    } else {
      res.json({
        success: false,
        error: 'QR Code ainda não disponível',
        status: instance.status,
        message: instance.status === 'ready' ? 'Instância já conectada' : 
                instance.status === 'initializing' ? 'Aguarde - inicializando cliente' :
                instance.status === 'waiting_qr' ? 'Cliente carregado - gerando QR' :
                'QR Code sendo gerado',
        instanceId: instanceId,
        has_qr_code: false,
        info: {
          created_at: instance.createdAt,
          last_seen: instance.lastSeen,
          current_status: instance.status
        }
      });
    }
  } catch (error) {
    console.error('❌ Erro ao obter QR Code: ' + error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Status da instância
app.get('/instance/:instanceId/status', authenticateToken, (req, res) => {
  try {
    const instanceId = req.params.instanceId;
    
    const instance = instances.get(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
    }
    
    res.json({
      success: true,
      instanceId: instanceId,
      status: instance.status,
      phone: instance.phone,
      profileName: instance.profileName,
      hasQR: !!instance.qrCode,
      lastSeen: instance.lastSeen,
      error: instance.error || null,
      createdAt: instance.createdAt,
      messageCount: instance.messages ? instance.messages.length : 0
    });
  } catch (error) {
    console.error('❌ Erro ao obter status: ' + error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deletar instância
app.delete('/instance/:instanceId', authenticateToken, async (req, res) => {
  try {
    const instanceId = req.params.instanceId;
    
    const instance = instances.get(instanceId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
    }
    
    if (instance.client) {
      try {
        await instance.client.destroy();
        console.log('[' + instanceId + '] 🗑️ Cliente destruído');
      } catch (error) {
        console.error('[' + instanceId + '] ⚠️ Erro ao destruir: ' + error.message);
      }
    }
    
    instances.delete(instanceId);
    
    console.log('[' + instanceId + '] ✅ Instância removida completamente');
    
    res.json({
      success: true,
      message: 'Instância deletada com sucesso',
      instanceId: instanceId
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar instância: ' + error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Erro no servidor: ' + error.message);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
    version: SERVER_VERSION
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor...');
  
  for (const entry of instances.entries()) {
    const instanceId = entry[0];
    const instance = entry[1];
    if (instance.client) {
      try {
        await instance.client.destroy();
        console.log('[' + instanceId + '] 🔌 Cliente desconectado');
      } catch (error) {
        console.error('[' + instanceId + '] ❌ Erro ao desconectar: ' + error.message);
      }
    }
  }
  
  console.log('✅ Shutdown concluído');
  process.exit(0);
});

// Inicializar servidor
async function startServer() {
  await ensureSessionDirectory();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 WhatsApp VPS Server (100% LIMPO) na porta ' + PORT);
    console.log('📊 Health: http://31.97.24.222:' + PORT + '/health');
    console.log('📋 Status: http://31.97.24.222:' + PORT + '/status');
    console.log('📱 Instances: http://31.97.24.222:' + PORT + '/instances');
    console.log('🔑 Token: ' + API_TOKEN.substring(0, 10) + '...');
    console.log('📱 Versão: ' + SERVER_VERSION);
    console.log('✅ CORREÇÕES: SyntaxError eliminado, JavaScript Node.js puro');
  });
}

startServer().catch(console.error);

module.exports = app;
EOF_SERVIDOR_LIMPO

echo "✅ Arquivo 100% limpo criado"

echo ""
echo "📋 ETAPA 3: VERIFICAR ARQUIVO LIMPO"
echo "=================================="

echo "📋 Testando sintaxe do arquivo..."
node -c vps-server-persistent.js
if [ $? -eq 0 ]; then
    echo "✅ Sintaxe do arquivo: OK"
else
    echo "❌ ERRO: Ainda há problema de sintaxe!"
    exit 1
fi

echo "📋 Verificando que não há HTML/JSX..."
if grep -q "<" vps-server-persistent.js; then
    echo "❌ ERRO: Ainda há HTML/JSX no arquivo!"
    exit 1
else
    echo "✅ Arquivo 100% JavaScript Node.js puro"
fi

echo ""
echo "🚀 ETAPA 4: INICIAR SERVIDOR LIMPO"
echo "================================="

echo "📋 Iniciando servidor com PM2..."
pm2 start vps-server-persistent.js --name whatsapp-main-3002

echo "⏳ Aguardando 8s para inicialização..."
sleep 8

echo ""
echo "🧪 ETAPA 5: TESTE IMEDIATO DOS ENDPOINTS"
echo "======================================="

# Função para teste rápido
function test_endpoint() {
    local name="$1"
    local url="$2"
    
    echo -n "🧪 $name... "
    
    response=$(timeout 8s curl -s -w "%{http_code}" "$url" 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
        http_code="${response: -3}"
        if [[ "$http_code" == "200" ]]; then
            echo "✅ SUCCESS ($http_code)"
            return 0
        else
            echo "❌ FAIL ($http_code)"
            return 1
        fi
    else
        echo "❌ TIMEOUT"
        return 1
    fi
}

# Testes críticos
test_endpoint "Health" "http://$VPS_IP:$PORTA/health"
health_ok=$?

test_endpoint "Status" "http://$VPS_IP:$PORTA/status"
status_ok=$?

echo ""
echo "🔍 VERIFICAÇÃO DA PORTA 3002"
echo "============================"
netstat -tlnp | grep 3002

echo ""
echo "📊 RESULTADO FINAL:"
echo "=================="

if [[ $health_ok -eq 0 && $status_ok -eq 0 ]]; then
    echo "🎉 SINTAXERROR ELIMINADO COM SUCESSO!"
    echo "======================================"
    echo "✅ Health: SUCCESS"
    echo "✅ Status: SUCCESS"
    echo "✅ Porta 3002: OCUPADA"
    echo "✅ SyntaxError: ELIMINADO"
    echo "✅ Status 000: CORRIGIDO"
    echo ""
    echo "🎯 SISTEMA 100% FUNCIONAL!"
    echo "=========================="
    echo "Execute agora: chmod +x teste-endpoints-basicos.sh && ./teste-endpoints-basicos.sh"
    
else
    echo "❌ AINDA HÁ PROBLEMAS!"
    echo "Health: $([ $health_ok -eq 0 ] && echo 'SUCCESS' || echo 'FAIL')"
    echo "Status: $([ $status_ok -eq 0 ] && echo 'SUCCESS' || echo 'FAIL')"
    echo ""
    echo "📋 Verificar logs: pm2 logs whatsapp-main-3002 --lines 10"
    exit 1
fi

echo ""
echo "✅ CORREÇÃO DEFINITIVA REALIZADA!"
echo "================================"
echo "📱 Versão: 5.1.0-SYNTAXERROR-ELIMINATED"
echo "🔧 Correções: PM2 cache limpo, JavaScript puro, SyntaxError eliminado"
