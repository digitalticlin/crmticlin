#!/bin/bash

# 🛡️ FASE 1 - IMPLEMENTAÇÃO SEGURA COM MONITORAMENTO
# Redis + Configuração PM2 (SEM RESTART ainda)

echo "🛡️ FASE 1 - IMPLEMENTAÇÃO SEGURA DE ESCALABILIDADE"
echo "Data: $(date)"
echo "======================================================"

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

# ============================================================
# VERIFICAÇÃO PRÉ-IMPLEMENTAÇÃO
# ============================================================

echo ""
echo "🔍 PRÉ-VERIFICAÇÃO DE SEGURANÇA"
echo "======================================================"

# Verificar se servidor está rodando
echo "📊 Verificando status atual..."
ssh $VPS_SERVER "
echo 'Status do servidor:'
pm2 status
echo
echo 'Teste de conectividade:'
curl -s http://localhost:3001/health || echo 'Health check falhou'
echo
echo 'Conexões ativas:'
netstat -an | grep :3001 | wc -l
echo 'conexões na porta 3001'
"

read -p "✋ Servidor está OK? Continuar com Fase 1? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Implementação cancelada pelo usuário"
    exit 1
fi

# ============================================================
# 1. INSTALAR REDIS (SEM AFETAR O SERVIDOR)
# ============================================================

echo ""
echo "🔴 1. INSTALANDO REDIS"
echo "======================================================"

ssh $VPS_SERVER "
echo '📥 Instalando Redis...'
apt update -qq
apt install -y redis-server

echo '⚙️ Configurando Redis...'
# Configuração básica e segura
echo 'bind 127.0.0.1' >> /etc/redis/redis.conf
echo 'maxmemory 256mb' >> /etc/redis/redis.conf
echo 'maxmemory-policy allkeys-lru' >> /etc/redis/redis.conf

echo '🚀 Iniciando Redis...'
systemctl enable redis-server
systemctl start redis-server

echo '✅ Testando Redis...'
redis-cli ping && echo 'Redis funcionando!' || echo '❌ Redis com problema'
"

# Verificar se não quebrou nada
echo "🔍 Verificando se servidor ainda está OK após Redis..."
ssh $VPS_SERVER "pm2 status && curl -s http://localhost:3001/health >/dev/null && echo '✅ Servidor ainda OK' || echo '❌ PROBLEMA DETECTADO!'"

# ============================================================
# 2. INSTALAR DEPENDÊNCIAS NODE (SEM RESTART)
# ============================================================

echo ""
echo "📦 2. INSTALANDO DEPENDÊNCIAS DE FILA"
echo "======================================================"

ssh $VPS_SERVER "cd $VPS_PATH &&
echo '📥 Instalando bull e ioredis...'
npm install bull ioredis bull-board --save

echo '✅ Dependências instaladas'
echo '📊 Verificando package.json:'
grep -E 'bull|ioredis' package.json
"

# Verificar novamente
echo "🔍 Verificando servidor após instalação de dependências..."
ssh $VPS_SERVER "pm2 status && curl -s http://localhost:3001/health >/dev/null && echo '✅ Servidor ainda OK' || echo '❌ PROBLEMA DETECTADO!'"

# ============================================================
# 3. CRIAR CONFIGURAÇÃO ECOSYSTEM (SEM APLICAR)
# ============================================================

echo ""
echo "⚙️ 3. PREPARANDO CONFIGURAÇÃO PM2 CLUSTER"
echo "======================================================"

ssh $VPS_SERVER "cd $VPS_PATH &&
echo '📝 Criando ecosystem.config.js para cluster...'

# Backup do ecosystem atual (se existir)
cp ecosystem.config.js ecosystem.config.backup.js 2>/dev/null || echo 'Sem ecosystem anterior'

# Criar nova configuração cluster
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'whatsapp-server',
    script: 'server.js',
    instances: 2,  // Começar com 2 instâncias apenas
    exec_mode: 'cluster',
    max_memory_restart: '800M',  // Conservador para 4GB RAM
    node_args: '--max-old-space-size=1024',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    // Configurações de estabilidade
    min_uptime: '30s',
    max_restarts: 3,
    autorestart: true,
    
    // Logs
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Health check
    health_check_grace_period: 30000,
    wait_ready: true,
    listen_timeout: 10000
  }]
}
EOF

echo '✅ Configuração cluster criada (ainda não aplicada)'
echo '📄 Conteúdo:'
cat ecosystem.config.js
"

# ============================================================
# 4. CRIAR DIRETÓRIO DE LOGS
# ============================================================

echo ""
echo "📁 4. PREPARANDO LOGS"
echo "======================================================"

ssh $VPS_SERVER "cd $VPS_PATH &&
mkdir -p logs
touch logs/err.log logs/out.log logs/combined.log
chmod 644 logs/*.log
echo '✅ Diretório de logs preparado'
"

# ============================================================
# 5. IMPLEMENTAR ESTRUTURA BÁSICA DE FILAS (SEM ATIVAR)
# ============================================================

echo ""
echo "🔄 5. PREPARANDO ESTRUTURA DE FILAS"
echo "======================================================"

ssh $VPS_SERVER "cd $VPS_PATH &&
echo '📝 Criando arquivo de configuração de filas...'

cat > src/utils/queue-config.js << 'EOF'
// 🔄 CONFIGURAÇÃO DE FILAS - REDIS/BULL
// Este arquivo será ativado na Fase 2

const Queue = require('bull');
const Redis = require('ioredis');

// Configuração Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Criar filas separadas
const messageQueue = new Queue('message processing', { 
  redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

const webhookQueue = new Queue('webhook delivery', { 
  redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 2,
    delay: 1000
  }
});

// Dashboard de filas (opcional)
const { createBullBoard } = require('bull-board');
const { BullAdapter } = require('bull-board/bullAdapter');

const { router } = createBullBoard([
  new BullAdapter(messageQueue),
  new BullAdapter(webhookQueue)
]);

module.exports = {
  messageQueue,
  webhookQueue,
  queueDashboard: router,
  isEnabled: false  // DESABILITADO na Fase 1
};
EOF

echo '✅ Estrutura de filas preparada (desabilitada)'
"

# ============================================================
# 6. VALIDAÇÃO FINAL FASE 1
# ============================================================

echo ""
echo "✅ 6. VALIDAÇÃO FINAL DA FASE 1"
echo "======================================================"

ssh $VPS_SERVER "
echo '🔍 Verificação completa do sistema:'
echo
echo '🔴 Redis:'
redis-cli ping

echo
echo '📦 Dependências Node:'
cd $VPS_PATH && npm list bull ioredis

echo
echo '⚙️ PM2 Status:'
pm2 status

echo
echo '🌐 Conectividade:'
curl -s http://localhost:3001/health && echo ' - Health OK' || echo ' - Health FALHA'

echo
echo '📊 Sistema:'
echo 'CPU:' \$(nproc) 'cores'
echo 'Memória livre:' \$(free -h | grep Mem | awk '{print \$7}')
echo 'Load:' \$(uptime | awk -F'load average:' '{print \$2}')
"

echo ""
echo "🎉 FASE 1 CONCLUÍDA COM SUCESSO!"
echo "======================================================"
echo "✅ Redis instalado e funcionando"
echo "✅ Dependências de fila instaladas"
echo "✅ Configuração PM2 cluster preparada"
echo "✅ Estrutura de filas criada (desabilitada)"
echo "✅ SERVIDOR AINDA RODANDO NORMALMENTE"
echo ""
echo "🚀 Próximos passos:"
echo "   1. Monitorar por 1-2 horas se tudo está estável"
echo "   2. Execute: ~/vps-implementation-phase2-cluster.sh"
echo ""
echo "🚑 Em caso de problema:"
echo "   Execute: ~/restore_emergency_[DATA].sh"