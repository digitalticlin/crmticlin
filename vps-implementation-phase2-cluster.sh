#!/bin/bash

# 🚀 FASE 2 - ATIVAÇÃO SEGURA PM2 CLUSTER + MONITORAMENTO
# Mudança de fork → cluster com validação contínua

echo "🚀 FASE 2 - ATIVAÇÃO PM2 CLUSTER"
echo "Data: $(date)"
echo "======================================================"

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

# ============================================================
# VERIFICAÇÃO PRÉ-ATIVAÇÃO
# ============================================================

echo ""
echo "🔍 PRÉ-VERIFICAÇÃO ANTES DE ATIVAR CLUSTER"
echo "======================================================"

echo "📊 Verificando estado atual..."
ssh $VPS_SERVER "
echo 'Status do servidor atual:'
pm2 status
echo
echo 'Health check:'
curl -s http://localhost:3001/health | jq -r '.status' || echo 'Health check falhou'
echo
echo 'Instâncias WhatsApp ativas:'
curl -s http://localhost:3001/health | jq -r '.instances.active' || echo '0'
echo
echo 'Redis funcionando:'
redis-cli ping
echo
echo 'Memória disponível:'
free -h | grep Mem | awk '{print \$7}'
"

read -p "✋ Sistema está estável? Continuar com CLUSTER? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Fase 2 cancelada pelo usuário"
    exit 1
fi

# ============================================================
# 1. BACKUP ANTES DA MUDANÇA CRÍTICA
# ============================================================

echo ""
echo "💾 1. BACKUP DE SEGURANÇA PRE-CLUSTER"
echo "======================================================"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

ssh $VPS_SERVER "
echo '📦 Criando backup pre-cluster...'
cd ~
tar -czf backup-pre-cluster-$TIMESTAMP.tar.gz whatsapp-server/ --exclude='node_modules' --exclude='auth_info'
echo '✅ Backup pre-cluster criado: backup-pre-cluster-$TIMESTAMP.tar.gz'
ls -lh backup-pre-cluster-$TIMESTAMP.tar.gz
"

# ============================================================
# 2. ATIVAÇÃO MONITORADA DO CLUSTER
# ============================================================

echo ""
echo "🔄 2. ATIVAÇÃO PM2 CLUSTER (MONITORAMENTO ATIVO)"
echo "======================================================"

echo "⚠️ ATENÇÃO: O servidor terá ~30-60 segundos de downtime!"
echo "🔄 Iniciando mudança para cluster..."

ssh $VPS_SERVER "cd $VPS_PATH &&
echo '🛑 Parando aplicação atual...'
pm2 stop all
pm2 delete all

echo '🚀 Iniciando em modo CLUSTER...'
pm2 start ecosystem.config.js

echo '⏳ Aguardando 30 segundos para estabilização...'
sleep 30

echo '📊 Status inicial do cluster:'
pm2 status
"

# ============================================================
# 3. VALIDAÇÃO CRÍTICA PÓS-CLUSTER
# ============================================================

echo ""
echo "✅ 3. VALIDAÇÃO CRÍTICA DO CLUSTER"
echo "======================================================"

echo "🔍 Testando funcionalidades críticas..."

# Teste 1: Health Check
echo "🩺 Teste 1: Health Check..."
ssh $VPS_SERVER "
for i in {1..5}; do
  echo \"Tentativa \$i/5:\"
  HEALTH=\$(curl -s http://localhost:3001/health 2>/dev/null)
  if echo \"\$HEALTH\" | grep -q '\"status\":\"ok\"'; then
    echo '✅ Health OK'
    break
  else
    echo '❌ Health falhou, aguardando 10s...'
    sleep 10
  fi
done
"

# Teste 2: PM2 Cluster Status
echo ""
echo "⚙️ Teste 2: Status do Cluster..."
ssh $VPS_SERVER "
echo 'PM2 Cluster Status:'
pm2 status

echo
echo 'Verificando se todas as instâncias estão online:'
ONLINE_COUNT=\$(pm2 jlist | jq '[.[] | select(.pm2_env.status == \"online\")] | length')
echo \"Instâncias online: \$ONLINE_COUNT/2\"

if [ \$ONLINE_COUNT -eq 2 ]; then
  echo '✅ Todas as instâncias do cluster online'
else
  echo '❌ Nem todas as instâncias estão online!'
fi
"

# Teste 3: Instâncias WhatsApp
echo ""
echo "📱 Teste 3: Instâncias WhatsApp..."
ssh $VPS_SERVER "
echo 'Verificando instâncias WhatsApp:'
RESPONSE=\$(curl -s http://localhost:3001/health 2>/dev/null)
ACTIVE_INSTANCES=\$(echo \"\$RESPONSE\" | jq -r '.instances.active' 2>/dev/null || echo '0')
TOTAL_INSTANCES=\$(echo \"\$RESPONSE\" | jq -r '.instances.total' 2>/dev/null || echo '0')

echo \"Instâncias WhatsApp ativas: \$ACTIVE_INSTANCES/\$TOTAL_INSTANCES\"

if [ \$ACTIVE_INSTANCES -gt 5 ]; then
  echo '✅ Instâncias WhatsApp funcionando'
else
  echo '⚠️ Poucas instâncias ativas, mas pode ser normal após restart'
fi
"

# ============================================================
# 4. MONITORAMENTO CONTÍNUO (2 MINUTOS)
# ============================================================

echo ""
echo "📊 4. MONITORAMENTO CONTÍNUO (2 MINUTOS)"
echo "======================================================"

echo "🔍 Monitorando estabilidade do cluster..."
for i in {1..8}; do
    echo "📊 Verificação $i/8 ($(date +%H:%M:%S)):"
    
    ssh $VPS_SERVER "
    # Check PM2 status
    ONLINE=\$(pm2 jlist | jq '[.[] | select(.pm2_env.status == \"online\")] | length')
    echo \"  PM2 Online: \$ONLINE/2\"
    
    # Check health
    HEALTH=\$(curl -s http://localhost:3001/health 2>/dev/null | jq -r '.status' 2>/dev/null || echo 'fail')
    echo \"  Health: \$HEALTH\"
    
    # Check memory
    MEMORY=\$(pm2 jlist | jq -r '.[0].pm2_env.axm_monitor.\"Used Heap Size\".value' 2>/dev/null || echo '0')
    echo \"  Memória: \$MEMORY\"
    
    # Check load
    LOAD=\$(uptime | awk -F'load average:' '{print \$2}' | awk '{print \$1}' | sed 's/,//')
    echo \"  Load: \$LOAD\"
    "
    
    if [ $i -lt 8 ]; then
        echo "  ⏳ Aguardando 15 segundos..."
        sleep 15
    fi
done

# ============================================================
# 5. RESULTADO FINAL E PRÓXIMOS PASSOS
# ============================================================

echo ""
echo "🎯 5. ANÁLISE FINAL DO CLUSTER"
echo "======================================================"

ssh $VPS_SERVER "
echo '📊 Status Final:'
pm2 status

echo
echo '🔍 Informações detalhadas:'
pm2 info whatsapp-server

echo
echo '🌐 Teste final de conectividade:'
curl -s http://localhost:3001/health | jq '.' || curl -s http://localhost:3001/health

echo
echo '📈 Estatísticas do sistema:'
echo 'CPU:' \$(nproc) 'cores'
echo 'Load:' \$(uptime | awk -F'load average:' '{print \$2}')
echo 'Memória livre:' \$(free -h | grep Mem | awk '{print \$7}')
echo 'Conexões ativas:' \$(netstat -an | grep :3001 | grep ESTABLISHED | wc -l)
"

# Verificação de sucesso
echo ""
echo "🏁 VERIFICAÇÃO DE SUCESSO DA FASE 2"
echo "======================================================"

SUCCESS=true
echo "🔍 Validação final..."

# Teste final de health
FINAL_HEALTH=$(ssh $VPS_SERVER "curl -s http://localhost:3001/health 2>/dev/null | jq -r '.status' 2>/dev/null")
if [ "$FINAL_HEALTH" = "ok" ]; then
    echo "✅ Health check: OK"
else
    echo "❌ Health check: FALHA"
    SUCCESS=false
fi

# Teste final de PM2
PM2_ONLINE=$(ssh $VPS_SERVER "pm2 jlist | jq '[.[] | select(.pm2_env.status == \"online\")] | length'")
if [ "$PM2_ONLINE" = "2" ]; then
    echo "✅ PM2 Cluster: OK (2/2 online)"
else
    echo "❌ PM2 Cluster: PROBLEMA ($PM2_ONLINE/2 online)"
    SUCCESS=false
fi

echo ""
if [ "$SUCCESS" = true ]; then
    echo "🎉 FASE 2 CONCLUÍDA COM SUCESSO!"
    echo "======================================================"
    echo "✅ PM2 Cluster ativo (2 instâncias)"
    echo "✅ Servidor respondendo normalmente"
    echo "✅ Health check funcionando"
    echo "✅ Sistema estável"
    echo ""
    echo "📊 Capacidade aumentada:"
    echo "   - 2x mais processos"
    echo "   - Melhor uso do CPU"
    echo "   - Maior estabilidade"
    echo ""
    echo "🚀 Próximos passos:"
    echo "   1. Monitorar por algumas horas"
    echo "   2. Se tudo OK, executar Fase 3 (filas ativas)"
    echo "   3. Execute: ~/vps-implementation-phase3-queues.sh"
else
    echo "⚠️ FASE 2 COM PROBLEMAS!"
    echo "======================================================"
    echo "❌ Algum teste falhou"
    echo "🚑 Opções de recovery:"
    echo "   1. Aguardar mais tempo para estabilização"
    echo "   2. Executar: ~/restore_emergency_[DATA].sh"
    echo "   3. Investigar logs: pm2 logs"
fi

echo ""
echo "🚑 Backups disponíveis:"
echo "   - ~/backup-pre-cluster-$TIMESTAMP.tar.gz"
echo "   - ~/restore_emergency_20250829_001112.sh"