#!/bin/bash

# 🔒 BACKUP COMPLETO ANTES DE IMPLEMENTAR ESCALABILIDADE
# Execução segura para não quebrar o servidor em produção

echo "🔒 CRIANDO BACKUP COMPLETO DO SERVIDOR..."
echo "Data: $(date)"
echo "======================================================"

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup-escalabilidade-$BACKUP_DATE"

# ============================================================
# 1. BACKUP COMPLETO DO PROJETO
# ============================================================

echo ""
echo "📦 1. BACKUP DO PROJETO"
echo "======================================================"

ssh $VPS_SERVER "cd ~ && 
echo '🗂️ Criando backup completo...'
tar -czf $BACKUP_NAME.tar.gz whatsapp-server/ --exclude='node_modules' --exclude='auth_info'
echo '✅ Backup criado: $BACKUP_NAME.tar.gz'
echo
echo '📊 Tamanho do backup:'
ls -lh $BACKUP_NAME.tar.gz
"

# ============================================================
# 2. BACKUP SEPARADO DOS AUTH_INFO (CRÍTICO)
# ============================================================

echo ""
echo "🔐 2. BACKUP SEPARADO - AUTH_INFO"
echo "======================================================"

ssh $VPS_SERVER "cd ~/whatsapp-server && 
echo '🔐 Fazendo backup das autenticações WhatsApp...'
tar -czf ~/auth_info_backup_$BACKUP_DATE.tar.gz auth_info/
echo '✅ Auth backup: ~/auth_info_backup_$BACKUP_DATE.tar.gz'
echo
echo '📊 Tamanho do backup de auth:'
ls -lh ~/auth_info_backup_$BACKUP_DATE.tar.gz
"

# ============================================================
# 3. SNAPSHOT DO PM2 E SISTEMA
# ============================================================

echo ""
echo "⚙️ 3. SNAPSHOT DO ESTADO ATUAL"
echo "======================================================"

ssh $VPS_SERVER "
echo '📸 Salvando estado atual do sistema...'

# PM2 Status
pm2 list > ~/snapshot_pm2_$BACKUP_DATE.txt
pm2 env 0 > ~/snapshot_env_$BACKUP_DATE.txt 2>/dev/null || echo 'PM2 env não disponível'

# System info
echo '=== SYSTEM SNAPSHOT ===' > ~/snapshot_system_$BACKUP_DATE.txt
echo 'CPU Cores:' \$(nproc) >> ~/snapshot_system_$BACKUP_DATE.txt
echo 'Memory:' \$(free -h) >> ~/snapshot_system_$BACKUP_DATE.txt
echo 'Load:' \$(uptime) >> ~/snapshot_system_$BACKUP_DATE.txt
echo 'Disk:' \$(df -h /) >> ~/snapshot_system_$BACKUP_DATE.txt

# Network
echo 'Active connections:' \$(netstat -an | grep ESTABLISHED | wc -l) >> ~/snapshot_system_$BACKUP_DATE.txt
echo 'Port 3001:' \$(netstat -tuln | grep :3001) >> ~/snapshot_system_$BACKUP_DATE.txt

echo '✅ Snapshots salvos'
"

# ============================================================
# 4. VALIDAÇÃO DOS BACKUPS
# ============================================================

echo ""
echo "✅ 4. VALIDAÇÃO DOS BACKUPS"
echo "======================================================"

ssh $VPS_SERVER "
echo '🔍 Validando backups criados...'
echo
echo '📁 Arquivos de backup criados:'
ls -la ~/ | grep 'backup.*$BACKUP_DATE'
echo
echo '🧮 Verificando integridade:'
tar -tzf $BACKUP_NAME.tar.gz | wc -l && echo 'arquivos no backup principal'
tar -tzf auth_info_backup_$BACKUP_DATE.tar.gz | wc -l && echo 'arquivos no backup de auth'
"

# ============================================================
# 5. SCRIPT DE RESTORE RÁPIDO
# ============================================================

echo ""
echo "🚑 5. CRIANDO SCRIPT DE RESTORE DE EMERGÊNCIA"
echo "======================================================"

ssh $VPS_SERVER "cat > ~/restore_emergency_$BACKUP_DATE.sh << 'EOF'
#!/bin/bash
# 🚑 RESTORE DE EMERGÊNCIA - Caso algo dê errado

echo '🚑 RESTAURANDO BACKUP DE EMERGÊNCIA...'

# Parar PM2
pm2 stop all
pm2 delete all

# Restaurar projeto
cd ~
rm -rf whatsapp-server/
tar -xzf $BACKUP_NAME.tar.gz

# Restaurar auth_info
cd whatsapp-server/
rm -rf auth_info/
tar -xzf ~/auth_info_backup_$BACKUP_DATE.tar.gz

# Reinstalar dependências
npm install

# Reiniciar PM2
npm run start

echo '✅ RESTORE CONCLUÍDO!'
echo 'Verifique: pm2 status'
EOF

chmod +x ~/restore_emergency_$BACKUP_DATE.sh
echo '✅ Script de emergência criado: ~/restore_emergency_$BACKUP_DATE.sh'
"

echo ""
echo "🎯 BACKUP COMPLETO FINALIZADO!"
echo "======================================================"
echo "✅ Backup principal: $BACKUP_NAME.tar.gz"
echo "✅ Backup auth: auth_info_backup_$BACKUP_DATE.tar.gz"  
echo "✅ Snapshots: snapshot_*_$BACKUP_DATE.txt"
echo "✅ Restore de emergência: restore_emergency_$BACKUP_DATE.sh"
echo ""
echo "🚀 Agora você pode prosseguir com a implementação FASE por FASE"
echo "   Execute: ~/vps-implementation-phase1-safe.sh"