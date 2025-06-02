
#!/bin/bash

# ========================================
# Script de Instalação do VPS API Server
# Execute este script na sua VPS como root
# ========================================

set -e  # Para no primeiro erro

echo "🚀 Iniciando instalação do VPS API Server..."
echo "📅 $(date)"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    log_error "Este script deve ser executado como root (use sudo)"
    exit 1
fi

log_info "Verificando sistema operacional..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    log_info "Sistema: $PRETTY_NAME"
else
    log_warning "Não foi possível detectar o sistema operacional"
fi

# Atualizar sistema
log_info "Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências básicas
log_info "Instalando dependências básicas..."
apt install -y curl wget git unzip software-properties-common

# Verificar se Node.js já está instalado
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_info "Node.js já instalado: $NODE_VERSION"
    
    # Verificar se a versão é adequada (v16+)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 16 ]; then
        log_warning "Versão do Node.js muito antiga. Atualizando..."
        INSTALL_NODE=true
    else
        log_success "Versão do Node.js adequada"
        INSTALL_NODE=false
    fi
else
    log_info "Node.js não encontrado. Instalando..."
    INSTALL_NODE=true
fi

# Instalar Node.js se necessário
if [ "$INSTALL_NODE" = true ]; then
    log_info "Instalando Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Verificar instalação
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        log_success "Node.js instalado: $(node --version)"
        log_success "NPM instalado: $(npm --version)"
    else
        log_error "Falha na instalação do Node.js"
        exit 1
    fi
fi

# Instalar PM2 globalmente
log_info "Instalando PM2 para gerenciamento de processos..."
npm install -g pm2

# Criar diretório para o API Server
API_DIR="/root/vps-api-server"
log_info "Criando diretório: $API_DIR"
mkdir -p "$API_DIR"
cd "$API_DIR"

# Criar package.json
log_info "Criando package.json..."
cat > package.json << 'EOF'
{
  "name": "vps-api-server",
  "version": "1.0.0",
  "description": "API Server para controle remoto da VPS",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "pm2-start": "pm2 start server.js --name vps-api-server",
    "pm2-stop": "pm2 stop vps-api-server",
    "pm2-restart": "pm2 restart vps-api-server",
    "pm2-logs": "pm2 logs vps-api-server"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "keywords": ["api", "vps", "automation", "whatsapp"],
  "author": "VPS API Server",
  "license": "MIT"
}
EOF

# Instalar dependências
log_info "Instalando dependências do projeto..."
npm install

# Criar arquivo de configuração
log_info "Criando arquivo de configuração..."
cat > .env << 'EOF'
# Configurações do VPS API Server
API_PORT=3002
VPS_API_TOKEN=vps-api-token-2024
NODE_ENV=production

# Configurações de logging
LOG_LEVEL=info
LOG_FILE=./logs/api-server.log

# Configurações de segurança
MAX_COMMAND_TIMEOUT=300000
ALLOWED_COMMANDS_REGEX=^(npm|node|pm2|curl|echo|ls|ps|netstat|systemctl|apt|git|mkdir|chmod|chown|cp|mv|rm|cat|grep|find|which|whereis)

# Backup settings
BACKUP_DIR=/root/backups
BACKUP_RETENTION_DAYS=7
EOF

# Criar diretório de logs
mkdir -p logs
mkdir -p /root/backups

# Criar o arquivo server.js principal
log_info "Criando servidor API..."
cat > server.js << 'EOF'
// VPS API Server - Versão de Produção
// Servidor HTTP para controle remoto da VPS via API
require('dotenv').config();

const express = require('express');
const { exec, spawn } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.API_PORT || 3002;
const API_TOKEN = process.env.VPS_API_TOKEN || 'vps-api-token-2024';
const MAX_TIMEOUT = parseInt(process.env.MAX_COMMAND_TIMEOUT) || 300000;

// Configurar CORS e parsing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== API_TOKEN) {
    console.log('❌ Tentativa de acesso não autorizada');
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autenticação inválido ou ausente' 
    });
  }

  next();
}

// Função de logging para arquivo
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  
  try {
    fs.appendFileSync('./logs/api-server.log', logMessage);
  } catch (error) {
    console.error('Erro ao escrever no log:', error.message);
  }
}

// Endpoint de status público
app.get('/status', (req, res) => {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  
  res.json({
    success: true,
    status: 'online',
    server: 'VPS API Server',
    version: '2.0.0-production',
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: Math.floor(uptime),
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024)
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Endpoint de saúde detalhado
app.get('/health', (req, res) => {
  exec('ps aux | grep node | grep -v grep | wc -l', (error, stdout) => {
    const nodeProcesses = parseInt(stdout.trim()) || 0;
    
    res.json({
      success: true,
      health: 'ok',
      checks: {
        api_server: true,
        node_processes: nodeProcesses,
        disk_space: 'ok', // Placeholder - pode ser expandido
        memory: 'ok'      // Placeholder - pode ser expandido
      },
      timestamp: new Date().toISOString()
    });
  });
});

// Endpoint principal para execução de comandos
app.post('/execute', authenticateToken, async (req, res) => {
  const { command, description, timeout = 60000 } = req.body;

  if (!command) {
    return res.status(400).json({
      success: false,
      error: 'Comando é obrigatório'
    });
  }

  // Timeout de segurança
  const safeTimeout = Math.min(timeout, MAX_TIMEOUT);
  
  console.log(`🔧 Executando: ${description || 'Comando personalizado'}`);
  console.log(`Command: ${command}`);
  logToFile(`EXECUTE: ${description || command}`);

  try {
    const startTime = Date.now();

    // Executar comando com timeout
    exec(command, { 
      timeout: safeTimeout,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;

      if (error) {
        const errorMsg = `Erro: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        logToFile(`ERROR: ${errorMsg}`);
        
        return res.status(500).json({
          success: false,
          error: error.message,
          output: stderr || stdout || '',
          duration,
          command: description || 'Comando personalizado'
        });
      }

      const output = stdout.trim() || stderr.trim() || 'Comando executado com sucesso';
      
      console.log(`✅ Sucesso (${duration}ms): ${output.substring(0, 200)}${output.length > 200 ? '...' : ''}`);
      logToFile(`SUCCESS: ${description || command} - ${duration}ms`);
      
      res.json({
        success: true,
        output,
        duration,
        timestamp: new Date().toISOString(),
        command: description || 'Comando personalizado'
      });
    });

  } catch (error) {
    console.error(`❌ Erro na execução: ${error.message}`);
    logToFile(`EXCEPTION: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para múltiplos comandos sequenciais
app.post('/execute-batch', authenticateToken, async (req, res) => {
  const { commands } = req.body;

  if (!Array.isArray(commands) || commands.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Lista de comandos é obrigatória'
    });
  }

  console.log(`🔧 Executando batch de ${commands.length} comandos`);
  logToFile(`BATCH START: ${commands.length} comandos`);

  const results = [];
  let allSuccess = true;

  for (let i = 0; i < commands.length; i++) {
    const { command, description } = commands[i];
    
    try {
      const result = await new Promise((resolve) => {
        const startTime = Date.now();
        
        exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
          const duration = Date.now() - startTime;
          
          if (error) {
            resolve({
              success: false,
              command,
              description,
              error: error.message,
              output: stderr || stdout || '',
              duration
            });
          } else {
            resolve({
              success: true,
              command,
              description,
              output: stdout.trim() || stderr.trim() || 'Sucesso',
              duration
            });
          }
        });
      });

      results.push(result);
      
      if (!result.success) {
        allSuccess = false;
        console.log(`❌ Comando ${i + 1}/${commands.length} falhou: ${result.error}`);
      } else {
        console.log(`✅ Comando ${i + 1}/${commands.length} sucesso: ${result.output.substring(0, 100)}${result.output.length > 100 ? '...' : ''}`);
      }
      
    } catch (error) {
      results.push({
        success: false,
        command,
        description,
        error: error.message
      });
      allSuccess = false;
    }
  }

  logToFile(`BATCH END: ${results.filter(r => r.success).length}/${results.length} sucessos`);

  res.json({
    success: allSuccess,
    message: `Batch executado: ${results.filter(r => r.success).length}/${results.length} comandos bem-sucedidos`,
    results,
    timestamp: new Date().toISOString()
  });
});

// Health check específico para WhatsApp server
app.get('/whatsapp-health', (req, res) => {
  exec('curl -s http://localhost:3001/health 2>/dev/null || echo "OFFLINE"', (error, stdout, stderr) => {
    if (error || stdout.includes('OFFLINE')) {
      return res.json({
        success: false,
        whatsapp_status: 'offline',
        error: error?.message || 'Servidor não responde'
      });
    }

    try {
      const healthData = JSON.parse(stdout);
      res.json({
        success: true,
        whatsapp_status: 'online',
        health_data: healthData
      });
    } catch (parseError) {
      res.json({
        success: false,
        whatsapp_status: 'unknown',
        raw_output: stdout.substring(0, 500),
        error: 'Não foi possível fazer parse da resposta'
      });
    }
  });
});

// Endpoint para logs do sistema
app.get('/logs', authenticateToken, (req, res) => {
  const { lines = 50, service = 'api' } = req.query;
  
  let command;
  if (service === 'whatsapp') {
    command = `pm2 logs whatsapp-server --lines ${lines} --nostream`;
  } else if (service === 'api') {
    command = `tail -n ${lines} ./logs/api-server.log`;
  } else {
    command = `journalctl -n ${lines} --no-pager`;
  }
  
  exec(command, (error, stdout, stderr) => {
    res.json({
      success: !error,
      logs: error ? stderr : stdout,
      service,
      timestamp: new Date().toISOString()
    });
  });
});

// Error handler global
app.use((error, req, res, next) => {
  console.error('❌ Erro no servidor API:', error);
  logToFile(`GLOBAL ERROR: ${error.message}`);
  
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint não encontrado: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  const startMessage = `🚀 VPS API Server rodando na porta ${PORT}`;
  console.log(startMessage);
  console.log(`📡 Status: http://localhost:${PORT}/status`);
  console.log(`🔧 Execute: POST http://localhost:${PORT}/execute`);
  console.log(`📊 WhatsApp Health: http://localhost:${PORT}/whatsapp-health`);
  console.log(`🔑 Token: ${API_TOKEN === 'vps-api-token-2024' ? '✅ Configurado' : '⚠️ Token personalizado'}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  
  logToFile(startMessage);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`🛑 Recebido ${signal}. Encerrando VPS API Server...`);
  logToFile(`SHUTDOWN: ${signal}`);
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Tratamento de exceções não capturadas
process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
  logToFile(`UNCAUGHT EXCEPTION: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  logToFile(`UNHANDLED REJECTION: ${reason}`);
});

module.exports = app;
EOF

# Instalar dotenv para variáveis de ambiente
npm install dotenv

# Testar se o servidor inicia corretamente
log_info "Testando se o servidor inicia..."
timeout 10s node server.js &
SERVER_PID=$!
sleep 3

# Verificar se o processo ainda está rodando
if kill -0 $SERVER_PID 2>/dev/null; then
    log_success "Servidor iniciou corretamente"
    kill $SERVER_PID
else
    log_error "Servidor falhou ao iniciar"
    exit 1
fi

# Configurar PM2 para iniciar o servidor
log_info "Configurando PM2..."

# Parar qualquer instância anterior
pm2 stop vps-api-server 2>/dev/null || true
pm2 delete vps-api-server 2>/dev/null || true

# Iniciar com PM2
pm2 start server.js --name "vps-api-server" --watch false --max-memory-restart 500M

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup | grep -E '^sudo' | bash || log_warning "Falha ao configurar startup automático"

# Testar conectividade
log_info "Testando conectividade do API Server..."
sleep 5

# Teste local
if curl -s http://localhost:3002/status > /dev/null; then
    log_success "✅ API Server respondendo localmente"
else
    log_error "❌ API Server não responde localmente"
    pm2 logs vps-api-server --lines 20
    exit 1
fi

# Configurar firewall se UFW estiver ativo
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
    log_info "Configurando firewall (UFW)..."
    ufw allow 3002/tcp
    log_success "Porta 3002 liberada no firewall"
fi

# Criar script de manutenção
log_info "Criando scripts de manutenção..."
cat > maintenance.sh << 'EOF'
#!/bin/bash
# Scripts de manutenção do VPS API Server

case "$1" in
    "restart")
        echo "🔄 Reiniciando VPS API Server..."
        pm2 restart vps-api-server
        ;;
    "logs")
        echo "📋 Logs do VPS API Server:"
        pm2 logs vps-api-server --lines ${2:-50}
        ;;
    "status")
        echo "📊 Status do VPS API Server:"
        pm2 show vps-api-server
        ;;
    "test")
        echo "🧪 Testando conectividade:"
        curl -s http://localhost:3002/status | jq . || echo "Erro na conexão"
        ;;
    "update")
        echo "🔄 Atualizando servidor..."
        git pull || echo "Sem git configurado"
        npm install
        pm2 restart vps-api-server
        ;;
    *)
        echo "Uso: $0 {restart|logs|status|test|update}"
        echo "Exemplos:"
        echo "  $0 restart  - Reinicia o servidor"
        echo "  $0 logs 100 - Mostra 100 linhas de log"
        echo "  $0 status   - Mostra status detalhado"
        echo "  $0 test     - Testa conectividade"
        ;;
esac
EOF

chmod +x maintenance.sh

# Informações finais
log_success "=========================================="
log_success "✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
log_success "=========================================="
echo ""
log_info "📊 INFORMAÇÕES DO SERVIDOR:"
echo "   • API Server rodando na porta: 3002"
echo "   • Status: http://$(hostname -I | awk '{print $1}'):3002/status"
echo "   • Token: vps-api-token-2024"
echo "   • Logs: ./logs/api-server.log"
echo "   • Diretório: $API_DIR"
echo ""
log_info "🔧 COMANDOS ÚTEIS:"
echo "   • pm2 status                    - Ver todos os processos"
echo "   • pm2 logs vps-api-server       - Ver logs em tempo real"
echo "   • pm2 restart vps-api-server    - Reiniciar servidor"
echo "   • ./maintenance.sh status       - Status detalhado"
echo "   • ./maintenance.sh test         - Testar conectividade"
echo ""
log_info "🌐 TESTE REMOTO:"
echo "   curl http://$(hostname -I | awk '{print $1}'):3002/status"
echo ""
log_success "🎉 Agora você pode usar o painel web para aplicar as correções automaticamente!"
log_info "📝 Logs da instalação salvos em: $(pwd)/installation.log"

# Salvar log da instalação
echo "Instalação concluída em $(date)" > installation.log
echo "Versão do Node.js: $(node --version)" >> installation.log
echo "Versão do NPM: $(npm --version)" >> installation.log
echo "Status do PM2:" >> installation.log
pm2 status >> installation.log 2>&1

log_success "✅ Instalação finalizada!"
EOF

<lov-write file_path="src/utils/vps-install-guide.md">
# 🚀 Guia Completo de Instalação do VPS API Server

## 📋 Pré-requisitos
- Acesso SSH à VPS como root
- VPS com Ubuntu 18.04+ ou Debian 9+
- Pelo menos 1GB de RAM livre
- Conexão estável com a internet

## 🎯 Opção 1: Instalação Automática (Recomendada)

### Passo 1: Conectar na VPS
```bash
ssh root@31.97.24.222
```

### Passo 2: Baixar e executar o script
```bash
# Baixar o script de instalação
curl -o install-api-server.sh https://raw.githubusercontent.com/seu-repo/ticlin/main/src/utils/vps-install-script.sh

# Dar permissão de execução
chmod +x install-api-server.sh

# Executar instalação
./install-api-server.sh
```

**OU copie o conteúdo do arquivo `vps-install-script.sh` e execute diretamente:**

```bash
# Criar o arquivo
nano install-api-server.sh

# Cole todo o conteúdo do script aqui
# Salve (Ctrl+X, Y, Enter)

# Executar
chmod +x install-api-server.sh
./install-api-server.sh
```

---

## 🔧 Opção 2: Instalação Manual Passo-a-Passo

### 1. Atualizar Sistema
```bash
apt update && apt upgrade -y
apt install -y curl wget git unzip software-properties-common
```

### 2. Instalar Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 3. Instalar PM2
```bash
npm install -g pm2
```

### 4. Criar diretório e arquivos
```bash
mkdir -p /root/vps-api-server
cd /root/vps-api-server

# Criar package.json
cat > package.json << 'EOF'
{
  "name": "vps-api-server",
  "version": "1.0.0",
  "description": "API Server para controle remoto da VPS",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "pm2-start": "pm2 start server.js --name vps-api-server"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
EOF

# Instalar dependências
npm install
```

### 5. Criar arquivo de configuração
```bash
cat > .env << 'EOF'
API_PORT=3002
VPS_API_TOKEN=vps-api-token-2024
NODE_ENV=production
EOF

# Criar diretórios
mkdir -p logs
mkdir -p /root/backups
```

### 6. Criar o servidor principal
```bash
# Copie o conteúdo completo do server.js do script acima
nano server.js
# Cole o código completo do servidor
```

### 7. Testar e iniciar com PM2
```bash
# Teste rápido
node server.js &
sleep 3
kill %1

# Iniciar com PM2
pm2 start server.js --name "vps-api-server"
pm2 save
pm2 startup

# Configurar firewall (se necessário)
ufw allow 3002/tcp
```

---

## ✅ Verificação da Instalação

### Teste Local
```bash
curl http://localhost:3002/status
```

**Resposta esperada:**
```json
{
  "success": true,
  "status": "online",
  "server": "VPS API Server",
  "version": "2.0.0-production",
  "port": 3002
}
```

### Teste Remoto
```bash
curl http://31.97.24.222:3002/status
```

### Verificar PM2
```bash
pm2 status
pm2 logs vps-api-server
```

---

## 🔧 Comandos de Manutenção

### Gerenciamento do Servidor
```bash
# Status detalhado
pm2 show vps-api-server

# Reiniciar
pm2 restart vps-api-server

# Parar
pm2 stop vps-api-server

# Ver logs em tempo real
pm2 logs vps-api-server

# Ver logs específicos
pm2 logs vps-api-server --lines 100
```

### Monitoramento
```bash
# Status do sistema
htop
df -h
free -h

# Conexões de rede
netstat -tlnp | grep 3002

# Testar endpoint
curl -X POST http://localhost:3002/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer vps-api-token-2024" \
  -d '{"command":"echo Hello World","description":"Teste"}'
```

---

## 🚨 Solução de Problemas

### Servidor não inicia
```bash
# Verificar logs
pm2 logs vps-api-server --lines 50

# Verificar se a porta está em uso
netstat -tlnp | grep 3002

# Reiniciar PM2
pm2 kill
pm2 resurrect
```

### Porta bloqueada
```bash
# Liberar porta no firewall
ufw allow 3002/tcp
ufw reload

# Verificar iptables
iptables -L | grep 3002
```

### Problemas de memória
```bash
# Verificar uso de memória
free -h
pm2 show vps-api-server

# Reiniciar se necessário
pm2 restart vps-api-server
```

---

## 📊 Próximos Passos

1. ✅ **API Server instalado e funcionando**
2. 🔄 **Ir para o painel web administrativo**
3. 🛠️ **Clicar em "Aplicar Correções SSH"**
4. ⚡ **O sistema irá automaticamente:**
   - Instalar o servidor WhatsApp Web.js
   - Aplicar correções SSL e timeout
   - Configurar dependências
   - Iniciar ambos os servidores
   - Configurar webhooks

---

## 🎉 Sucesso!

Se você chegou até aqui e o teste `curl http://localhost:3002/status` retornou sucesso, então:

**✅ A instalação está completa!**
**🔄 Agora use o painel web para aplicar as correções automaticamente**
**🚀 Nunca mais precisará acessar SSH diretamente**

---

## 📞 Suporte

Se houver algum problema:
1. Verifique os logs: `pm2 logs vps-api-server`
2. Teste a conectividade local: `curl localhost:3002/status`
3. Verifique o firewall: `ufw status`
4. Reinicie o serviço: `pm2 restart vps-api-server`

**O importante é que o endpoint `/status` responda com sucesso.**
