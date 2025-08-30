#!/bin/bash

# 🔧 CRIAR ARQUIVO LOGGER.JS FALTANTE
echo "🔧 CRIANDO ARQUIVO LOGGER.JS FALTANTE"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

echo ""
echo "📁 1. VERIFICANDO ESTRUTURA DE DIRETÓRIOS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📂 Verificando diretório src/utils:'
ls -la src/utils/ 2>/dev/null || echo '❌ Diretório src/utils não existe'

echo ''
echo '📂 Criando diretório src/utils (se não existir):'
mkdir -p src/utils

echo ''
echo '📂 Verificando novamente:'
ls -la src/utils/
"

echo ""
echo "🔧 2. CRIANDO ARQUIVO LOGGER.JS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📝 Criando src/utils/logger.js...'
cat > src/utils/logger.js << 'LOGGER_EOF'
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const baseMsg = \`[\${timestamp}] [\${level.toUpperCase()}] \${message}\`;
    
    if (data) {
      return \`\${baseMsg} \${typeof data === 'object' ? JSON.stringify(data) : data}\`;
    }
    
    return baseMsg;
  }

  writeToFile(level, formattedMessage) {
    try {
      const logFile = path.join(this.logDir, \`\${level}.log\`);
      fs.appendFileSync(logFile, formattedMessage + '\\n');
    } catch (error) {
      console.error('Erro ao escrever log:', error);
    }
  }

  info(message, data = null) {
    const formatted = this.formatMessage('info', message, data);
    console.log(formatted);
    this.writeToFile('info', formatted);
  }

  error(message, data = null) {
    const formatted = this.formatMessage('error', message, data);
    console.error(formatted);
    this.writeToFile('error', formatted);
  }

  warn(message, data = null) {
    const formatted = this.formatMessage('warn', message, data);
    console.warn(formatted);
    this.writeToFile('warn', formatted);
  }

  debug(message, data = null) {
    const formatted = this.formatMessage('debug', message, data);
    console.log(formatted);
    this.writeToFile('debug', formatted);
  }
}

// Export singleton instance
module.exports = new Logger();
LOGGER_EOF

echo '✅ logger.js criado!'
"

echo ""
echo "🔧 3. VERIFICANDO SE CONNECTION-MANAGER EXISTE"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📂 Verificando src/utils/connection-manager.js:'
if [ -f 'src/utils/connection-manager.js' ]; then
  echo '✅ connection-manager.js existe'
  ls -la src/utils/connection-manager.js
else
  echo '❌ connection-manager.js NÃO existe - criando link simbólico...'
  
  # Procurar por connection-manager na raiz ou outros locais
  if [ -f 'src/connection-manager.js' ]; then
    echo '📋 Encontrado em src/connection-manager.js - criando link'
    ln -sf ../connection-manager.js src/utils/connection-manager.js
  elif [ -f 'utils/connection-manager.js' ]; then
    echo '📋 Encontrado em utils/connection-manager.js - criando link'
    ln -sf ../../utils/connection-manager.js src/utils/connection-manager.js
  else
    echo '⚠️ connection-manager.js não encontrado - workers podem precisar de ajuste'
  fi
fi
"

echo ""
echo "🚀 4. TESTANDO WORKERS APÓS CORREÇÃO"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🛑 Parando workers com erro...'
pm2 delete broadcast-worker 2>/dev/null || true
pm2 delete readmessages-worker 2>/dev/null || true

echo '⏳ Aguardando 3 segundos...'
sleep 3

echo '🚀 Iniciando broadcast-worker...'
pm2 start ecosystem.config.js --only broadcast-worker

echo '🚀 Iniciando readmessages-worker...'
pm2 start ecosystem.config.js --only readmessages-worker

echo '⏳ Aguardando 5 segundos...'
sleep 5

echo '📊 Status final:'
pm2 status

echo ''
echo '🧪 Testando workers:'
curl -s http://localhost:3004/health | head -3 && echo '✅ Broadcast Worker OK' || echo '❌ Broadcast ainda com problema'
curl -s http://localhost:3005/health | head -3 && echo '✅ ReadMessages Worker OK' || echo '❌ ReadMessages ainda com problema'
"

echo ""
echo "✅ CORREÇÃO DE DEPENDÊNCIAS CONCLUÍDA!"
echo "================================================="
echo "🎯 Se ainda houver erro, verificar logs:"
echo "pm2 logs broadcast-worker --lines 5"
echo "pm2 logs readmessages-worker --lines 5"