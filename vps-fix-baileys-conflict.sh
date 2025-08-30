#!/bin/bash

# 🔧 CORREÇÃO URGENTE - CONFLITO BAILEYS/PM2 CLUSTER
# Implementa distribuição de instâncias WhatsApp por processo

echo "🔧 CORREÇÃO URGENTE - CONFLITO BAILEYS"
echo "Data: $(date)"
echo "======================================================"

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

# ============================================================
# VERIFICAÇÃO PRÉ-CORREÇÃO
# ============================================================

echo ""
echo "🔍 PRÉ-VERIFICAÇÃO DO PROBLEMA"
echo "======================================================"

ssh $VPS_SERVER "cd $VPS_PATH &&
echo '📊 Status atual:'
pm2 status

echo
echo '🚨 Últimos erros de conflito:'
grep -r 'Stream Errored (conflict)' logs/ --include='*.log' | tail -3

echo
echo '📊 Instâncias WhatsApp tentando conectar:'
curl -s http://localhost:3001/health | jq -r '.instances' 2>/dev/null || echo 'Health check indisponível'
"

read -p "✋ Continuar com correção? Haverá ~60s downtime (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Correção cancelada"
    exit 1
fi

# ============================================================
# 1. BACKUP PRE-CORREÇÃO
# ============================================================

echo ""
echo "💾 1. BACKUP PRE-CORREÇÃO"
echo "======================================================"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

ssh $VPS_SERVER "cd ~ &&
echo '📦 Backup antes da correção...'
tar -czf backup-pre-fix-$TIMESTAMP.tar.gz whatsapp-server/ --exclude='node_modules' --exclude='auth_info' --exclude='logs'
echo '✅ Backup criado: backup-pre-fix-$TIMESTAMP.tar.gz'
"

# ============================================================
# 2. IMPLEMENTAR DISTRIBUIÇÃO DE INSTÂNCIAS
# ============================================================

echo ""
echo "🔄 2. IMPLEMENTANDO DISTRIBUIÇÃO DE INSTÂNCIAS"
echo "======================================================"

ssh $VPS_SERVER "cd $VPS_PATH &&
echo '📝 Modificando connection-manager.js...'

# Backup do arquivo original
cp src/utils/connection-manager.js src/utils/connection-manager.backup.js

# Implementar lógica de distribuição
cat > src/utils/instance-distribution.js << 'EOF'
// 🔄 DISTRIBUIÇÃO DE INSTÂNCIAS WHATSAPP POR PROCESSO PM2
// Resolve conflito Baileys + Cluster

const cluster = require('cluster');

class InstanceDistribution {
  constructor() {
    // Definir range de instâncias por processo
    this.processId = process.env.NODE_APP_INSTANCE || 0;
    this.instancesPerProcess = 10; // Máximo por processo
    
    // Calcular range para este processo
    this.startInstance = (this.processId * this.instancesPerProcess) + 1;
    this.endInstance = this.startInstance + this.instancesPerProcess - 1;
    
    console.log(\`🔄 Processo \${this.processId}: Instâncias \${this.startInstance}-\${this.endInstance}\`);
  }
  
  // Verificar se esta instância deve ser gerenciada por este processo
  shouldManageInstance(instanceId) {
    const numId = parseInt(instanceId);
    return numId >= this.startInstance && numId <= this.endInstance;
  }
  
  // Obter instâncias para este processo
  getMyInstances(allInstances) {
    return allInstances.filter(instance => 
      this.shouldManageInstance(instance.id || instance.instanceId)
    );
  }
  
  // Gerar ID único por processo
  generateInstanceId() {
    const baseId = this.startInstance + Math.floor(Math.random() * this.instancesPerProcess);
    return \`whatsapp_\${baseId}_proc\${this.processId}\`;
  }
}

module.exports = new InstanceDistribution();
EOF

echo '✅ Sistema de distribuição criado'

echo
echo '🔧 Modificando connection-manager.js para usar distribuição...'

# Adicionar import e filtro no connection-manager
sed -i '1i const instanceDistribution = require(\"./instance-distribution\");' src/utils/connection-manager.js

# Adicionar verificação antes de criar conexão
sed -i '/createInstance.*function/a\\n  // Verificar se esta instância pertence a este processo\\n  if (!instanceDistribution.shouldManageInstance(instanceId)) {\\n    console.log(\`⚠️ Instância \${instanceId} não pertence ao processo \${process.env.NODE_APP_INSTANCE}\`);\\n    return null;\\n  }\\n' src/utils/connection-manager.js

echo '✅ Connection manager modificado'
"

# ============================================================
# 3. ATUALIZAR ECOSYSTEM CONFIG
# ============================================================

echo ""
echo "⚙️ 3. ATUALIZANDO CONFIGURAÇÃO PM2"
echo "======================================================"

ssh $VPS_SERVER "cd $VPS_PATH &&
echo '📝 Atualizando ecosystem.config.js com variáveis de ambiente...'

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'whatsapp-server',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '800M',
    node_args: '--max-old-space-size=1024',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      INSTANCE_DISTRIBUTION: 'true'
    },
    // Configurações de estabilidade
    min_uptime: '30s',
    max_restarts: 3,
    autorestart: true,
    
    // Logs separados por instância
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

echo '✅ Ecosystem config atualizado'
"

# ============================================================
# 4. APLICAR CORREÇÃO COM MONITORAMENTO
# ============================================================

echo ""
echo "🚀 4. APLICANDO CORREÇÃO (DOWNTIME: ~60s)"
echo "======================================================"

ssh $VPS_SERVER "cd $VPS_PATH &&
echo '🛑 Parando cluster atual...'
pm2 stop all
pm2 delete all

echo '⏳ Aguardando 10 segundos...'
sleep 10

echo '🚀 Reiniciando com distribuição...'
pm2 start ecosystem.config.js

echo '⏳ Aguardando estabilização (60 segundos)...'
sleep 60

echo '📊 Status após correção:'
pm2 status
"

# ============================================================
# 5. VALIDAÇÃO DA CORREÇÃO
# ============================================================

echo ""
echo "✅ 5. VALIDAÇÃO DA CORREÇÃO"
echo "======================================================"

echo "🔍 Testando se conflito foi resolvido..."
for i in {1..5}; do
  echo "📊 Teste $i/5 ($(date +%H:%M:%S)):"
  
  ssh $VPS_SERVER "
  echo '  PM2 Status:'
  pm2 list | grep -E 'online|stopped|errored' | wc -l
  
  echo '  Health Check:'
  curl -s http://localhost:3001/health >/dev/null && echo '  ✅ Health OK' || echo '  ❌ Health falha'
  
  echo '  Erros de conflito recentes:'
  tail -20 ~/whatsapp-server/logs/out-0.log | grep -c 'Stream Errored.*conflict' || echo '  0'
  
  echo '  Instâncias por processo:'
  grep -E 'Processo.*Instâncias' ~/whatsapp-server/logs/out-*.log | tail -2
  "
  
  if [ $i -lt 5 ]; then
    echo "  ⏳ Aguardando 30 segundos..."
    sleep 30
  fi
done

# ============================================================
# 6. RESULTADO FINAL
# ============================================================

echo ""
echo "🎯 6. RESULTADO DA CORREÇÃO"
echo "======================================================"

# Verificar se correção funcionou
CONFLICTS=$(ssh $VPS_SERVER "tail -100 ~/whatsapp-server/logs/out-*.log | grep -c 'Stream Errored.*conflict' || echo 0")
PM2_ONLINE=$(ssh $VPS_SERVER "pm2 jlist | jq '[.[] | select(.pm2_env.status == \"online\")] | length'")

echo "📊 Métricas pós-correção:"
echo "   - Conflitos nos últimos logs: $CONFLICTS"
echo "   - Processos PM2 online: $PM2_ONLINE/2"

if [ "$CONFLICTS" = "0" ] && [ "$PM2_ONLINE" = "2" ]; then
  echo ""
  echo "🎉 CORREÇÃO BEM-SUCEDIDA!"
  echo "======================================================"
  echo "✅ Conflitos de reconexão resolvidos"
  echo "✅ Distribuição de instâncias funcionando"
  echo "✅ PM2 Cluster estável"
  echo "✅ Sistema pronto para Fase 3 (Filas)"
  echo ""
  echo "🚀 Próximo passo:"
  echo "   Execute: ~/vps-implementation-phase3-queues.sh"
else
  echo ""
  echo "⚠️ CORREÇÃO PARCIAL OU PROBLEMAS DETECTADOS"
  echo "======================================================"
  echo "🔍 Recomendações:"
  echo "   1. Aguardar mais 30 minutos de monitoramento"
  echo "   2. Se persistir, executar: ~/revert-to-fork-mode.sh"
  echo "   3. Verificar logs: pm2 logs"
fi

echo ""
echo "🗂️ Arquivos de backup criados:"
echo "   - ~/backup-pre-fix-$TIMESTAMP.tar.gz"
echo "   - ~/whatsapp-server/src/utils/connection-manager.backup.js"