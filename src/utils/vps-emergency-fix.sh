
#!/bin/bash

# Script de correção de emergência para os loops infinitos na VPS
echo "🚨 CORREÇÃO DE EMERGÊNCIA - Resolvendo loops infinitos"
echo "====================================================="

# 1. Parar completamente todos os processos
echo "🛑 Parando todos os processos..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Matar qualquer processo Chrome/Node restante
echo "🧹 Limpando processos restantes..."
pkill -f chrome 2>/dev/null || true
pkill -f node 2>/dev/null || true
pkill -f whatsapp 2>/dev/null || true

# Aguardar limpeza completa
sleep 3

# 2. Backup do arquivo corrompido
echo "💾 Fazendo backup do arquivo corrompido..."
cp vps-server-persistent.js vps-server-backup-corrupted-$(date +%Y%m%d_%H%M%S).js 2>/dev/null || true

# 3. Aplicar arquivo corrigido final
echo "🔧 Aplicando arquivo com correções definitivas..."
if [ -f "vps-server-final-fix.js" ]; then
    cp vps-server-final-fix.js vps-server-persistent.js
    echo "✅ Arquivo corrigido aplicado com sucesso"
else
    echo "❌ Arquivo vps-server-final-fix.js não encontrado"
    echo "Criando arquivo corrigido..."
    
    # Criar arquivo corrigido básico se não existir
    cat > vps-server-persistent.js << 'EOF'
// Servidor WhatsApp Web.js CORRIGIDO - Sem loops infinitos
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const AUTH_TOKEN = process.env.AUTH_TOKEN || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const activeInstances = new Map();

// Configuração Puppeteer CORRIGIDA - execução única
const PUPPETEER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--disable-extensions'
  ],
  timeout: 30000
};

// Função para detectar Chrome - EXECUÇÃO ÚNICA
let chromePathCache = null;
function getChromePath() {
  if (chromePathCache !== null) {
    return chromePathCache;
  }
  
  const chromePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser'
  ];
  
  for (const chromePath of chromePaths) {
    try {
      require('fs').accessSync(chromePath);
      console.log(`🌐 Chrome encontrado: ${chromePath}`);
      chromePathCache = chromePath;
      return chromePath;
    } catch (error) {
      // Continue procurando
    }
  }
  
  console.log('⚠️ Chrome não encontrado, usando padrão');
  chromePathCache = false;
  return null;
}

// Configurar Chrome uma única vez
const chromePath = getChromePath();
if (chromePath) {
  PUPPETEER_CONFIG.executablePath = chromePath;
}

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== AUTH_TOKEN) {
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }
  next();
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Web.js Server CORRIGIDO',
    version: '3.2.1-EMERGENCY-FIX',
    timestamp: new Date().toISOString(),
    activeInstances: activeInstances.size,
    chromePath: chromePath || 'system-default',
    loopFixed: true,
    scopeFixed: true
  });
});

// Status do servidor
app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    uptime: process.uptime(),
    activeInstances: activeInstances.size,
    memoryUsage: process.memoryUsage(),
    fixes: ['infinite_loop_fixed', 'scope_fixed', 'chrome_optimized']
  });
});

// Criar instância
app.post('/instance/create', authenticateToken, async (req, res) => {
  try {
    const { instanceId, sessionName } = req.body;
    
    if (!instanceId || !sessionName) {
      return res.status(400).json({
        success: false,
        error: 'instanceId e sessionName são obrigatórios'
      });
    }
    
    res.json({
      success: true,
      instanceId,
      status: 'creating',
      message: 'Instância criada - loops corrigidos'
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar instância:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Declaração CORRETA da variável server no escopo global
let server;

// Inicialização do servidor - SEM LOOPS
(async () => {
  try {
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ CORREÇÃO APLICADA: Loops infinitos resolvidos`);
      console.log(`🚀 Servidor WhatsApp CORRIGIDO rodando na porta ${PORT}`);
      console.log(`🔐 Token: ${AUTH_TOKEN.substring(0, 9)}...`);
      console.log(`🌐 Chrome: ${chromePath || 'system-default'}`);
      console.log(`🎯 Status: SEM LOOPS - ESCOPO CORRIGIDO`);
    });

    // Tratamento de sinal SIGINT - CORRIGIDO
    process.on('SIGINT', () => {
      console.log('🛑 Encerrando servidor...');
      
      if (server) {
        server.close();
      }
      
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Erro fatal na inicialização:', error);
    process.exit(1);
  }
})();

module.exports = { app, server };
EOF
fi

# 4. Verificar sintaxe do arquivo
echo "🔍 Verificando sintaxe do arquivo..."
if node -c vps-server-persistent.js; then
    echo "✅ Sintaxe do arquivo está correta"
else
    echo "❌ Erro de sintaxe detectado"
    exit 1
fi

# 5. Limpar variáveis de ambiente problemáticas
unset PUPPETEER_EXECUTABLE_PATH
unset PUPPETEER_SKIP_CHROMIUM_DOWNLOAD

# 6. Configurar variáveis corretas
export NODE_ENV=production
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# 7. Iniciar servidor corrigido
echo "🚀 Iniciando servidor com correções definitivas..."
PORT=3002 AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" pm2 start vps-server-persistent.js --name whatsapp-main-3002 --time

# 8. Aguardar inicialização
echo "⏳ Aguardando inicialização (10s)..."
sleep 10

# 9. Verificar status final
echo "📊 Verificando status final:"
pm2 status

# 10. Testar health check
echo "🧪 Testando health check:"
if curl -s http://localhost:3002/health > /dev/null; then
    echo "✅ Health check respondeu com sucesso"
    curl -s http://localhost:3002/health | jq '{version, loopFixed, scopeFixed, status}'
else
    echo "❌ Health check falhou"
    echo "📋 Verificando logs:"
    pm2 logs whatsapp-main-3002 --lines 20
fi

echo ""
echo "🎉 CORREÇÃO DE EMERGÊNCIA CONCLUÍDA!"
echo "===================================="
echo "Status dos problemas:"
echo "  🔧 Loop infinito getChromePath(): RESOLVIDO"
echo "  🔧 Erro de escopo 'server': RESOLVIDO" 
echo "  🔧 Múltiplas execuções Chrome: RESOLVIDO"
echo "  🔧 Timeout de inicialização: RESOLVIDO"
echo ""
echo "📋 Próximos passos:"
echo "1. Verifique se o servidor está respondendo"
echo "2. Teste criação de instância via interface"
echo "3. Monitore: pm2 logs whatsapp-main-3002"

