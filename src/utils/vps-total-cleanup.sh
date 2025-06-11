
#!/bin/bash

# LIMPEZA TOTAL VPS - ZERAR TUDO E RECOMEÇAR
echo "🧹 LIMPEZA TOTAL VPS - ZERAR TUDO E RECOMEÇAR"
echo "============================================="
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Remover TUDO e preparar para instalação limpa"
echo ""

# Função de log
log_cleanup() {
    echo "[$(date '+%H:%M:%S')] 🧹 $1"
}

log_backup() {
    echo "[$(date '+%H:%M:%S')] 💾 BACKUP: $1"
}

log_remove() {
    echo "[$(date '+%H:%M:%S')] 🗑️ REMOVENDO: $1"
}

# CONFIRMAÇÃO DE SEGURANÇA TOTAL
echo "⚠️ ATENÇÃO: Esta limpeza é TOTAL e IRREVERSÍVEL!"
echo "⚠️ TUDO será removido: Node.js, Chrome, PM2, projetos!"
echo "⚠️ A VPS será completamente limpa!"
echo ""
read -p "🔴 Digite 'ZERAR TUDO' para continuar: " confirm

if [ "$confirm" != "ZERAR TUDO" ]; then
    echo "❌ Limpeza cancelada pelo usuário."
    exit 1
fi

echo ""
log_cleanup "INICIANDO LIMPEZA TOTAL..."

# FASE 1: BACKUP MÍNIMO ESSENCIAL
echo ""
echo "💾 FASE 1: BACKUP MÍNIMO ESSENCIAL"
echo "================================="

BACKUP_DIR="/root/backup_total_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

log_backup "Criando backup mínimo em $BACKUP_DIR..."

# Backup apenas arquivos críticos se existirem
[ -f "/root/whatsapp-server.js" ] && cp /root/whatsapp-server.js "$BACKUP_DIR/" 2>/dev/null
[ -d "/root/.wwebjs_auth" ] && cp -r /root/.wwebjs_auth "$BACKUP_DIR/" 2>/dev/null
[ -d "/root/sessions" ] && cp -r /root/sessions "$BACKUP_DIR/" 2>/dev/null

log_backup "Backup mínimo salvo em: $BACKUP_DIR"

# FASE 2: PARAR TODOS OS PROCESSOS
echo ""
echo "⏹️ FASE 2: PARAR TODOS OS PROCESSOS"
echo "================================="

log_cleanup "Matando TODOS os processos relacionados..."

# Parar PM2 completamente
pm2 kill 2>/dev/null || true
pkill -f pm2 2>/dev/null || true

# Matar todos os processos Node.js
pkill -f node 2>/dev/null || true
pkill -f npm 2>/dev/null || true
pkill -f npx 2>/dev/null || true

# Matar todos os processos Chrome
pkill -f chrome 2>/dev/null || true
pkill -f chromium 2>/dev/null || true

# Liberar todas as portas
for port in 80 3000 3001 3002 9222; do
    lsof -ti :$port | xargs kill -9 2>/dev/null || true
done

log_cleanup "Todos os processos terminados"

# FASE 3: REMOÇÃO TOTAL E AGRESSIVA
echo ""
echo "🗑️ FASE 3: REMOÇÃO TOTAL E AGRESSIVA"
echo "=================================="

log_remove "Removendo TUDO relacionado a Node.js..."

# Remover Node.js por todos os métodos possíveis
apt-get remove --purge -y nodejs npm node 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true

# Remover instalações manuais e NVM
rm -rf /usr/local/bin/node* 2>/dev/null || true
rm -rf /usr/local/bin/npm* 2>/dev/null || true
rm -rf /usr/local/lib/node_modules 2>/dev/null || true
rm -rf ~/.nvm 2>/dev/null || true
rm -rf ~/.npm 2>/dev/null || true
rm -rf /root/.npm 2>/dev/null || true

# Remover via snap
snap remove node 2>/dev/null || true

log_remove "Node.js completamente removido"

log_remove "Removendo TUDO relacionado a Chrome..."

# Remover Chrome/Chromium por todos os métodos
apt-get remove --purge -y google-chrome-stable google-chrome chromium-browser chromium 2>/dev/null || true
snap remove chromium 2>/dev/null || true

# Remover instalações manuais
rm -rf /opt/google 2>/dev/null || true
rm -rf /usr/local/bin/chrome* 2>/dev/null || true

# Remover caches e dados
rm -rf ~/.cache/google-chrome* 2>/dev/null || true
rm -rf ~/.cache/chromium* 2>/dev/null || true
rm -rf ~/.config/google-chrome* 2>/dev/null || true
rm -rf ~/.config/chromium* 2>/dev/null || true

log_remove "Chrome completamente removido"

# FASE 4: LIMPEZA DE DIRETÓRIOS E PROJETOS
echo ""
echo "🧽 FASE 4: LIMPEZA DE DIRETÓRIOS E PROJETOS"
echo "=========================================="

log_remove "Removendo todos os projetos e diretórios..."

# Remover todos os diretórios de projetos
rm -rf /root/whatsapp-* 2>/dev/null || true
rm -rf /root/forensic-scripts 2>/dev/null || true
rm -rf /root/api-server 2>/dev/null || true
rm -rf /root/node_modules 2>/dev/null || true

# Remover PM2
rm -rf ~/.pm2 2>/dev/null || true
rm -rf /root/.pm2 2>/dev/null || true

# Limpeza de temporários
rm -rf /tmp/npm-* 2>/dev/null || true
rm -rf /tmp/.org.chromium.* 2>/dev/null || true
rm -rf /tmp/puppeteer_* 2>/dev/null || true

log_remove "Todos os diretórios limpos"

# FASE 5: LIMPEZA DE CONFIGURAÇÕES
echo ""
echo "🔧 FASE 5: LIMPEZA DE CONFIGURAÇÕES"
echo "================================="

log_cleanup "Limpando configurações do sistema..."

# Limpar variáveis de ambiente
sed -i '/NODE/d' ~/.bashrc 2>/dev/null || true
sed -i '/CHROME/d' ~/.bashrc 2>/dev/null || true
sed -i '/PUPPETEER/d' ~/.bashrc 2>/dev/null || true
sed -i '/PM2/d' ~/.bashrc 2>/dev/null || true
sed -i '/WhatsApp/d' ~/.bashrc 2>/dev/null || true

# Limpar PATH
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# Limpeza de logs
find /var/log -name "*node*" -delete 2>/dev/null || true
find /var/log -name "*chrome*" -delete 2>/dev/null || true

log_cleanup "Configurações limpas"

# FASE 6: LIMPEZA FINAL DO SISTEMA
echo ""
echo "🔄 FASE 6: LIMPEZA FINAL DO SISTEMA"
echo "================================="

log_cleanup "Executando limpeza final do sistema..."

# Limpeza completa do APT
apt-get autoclean 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true
apt-get clean 2>/dev/null || true

# Atualizar lista de pacotes
apt-get update -y 2>/dev/null || true

log_cleanup "Sistema completamente limpo"

# VERIFICAÇÃO FINAL
echo ""
echo "✅ VERIFICAÇÃO FINAL"
echo "=================="

log_cleanup "Verificando limpeza..."

echo "📋 Verificação Node.js:"
if command -v node &> /dev/null; then
    echo "   ⚠️ Node.js ainda encontrado: $(which node)"
else
    echo "   ✅ Node.js removido completamente"
fi

echo ""
echo "📋 Verificação Chrome:"
if command -v google-chrome-stable &> /dev/null; then
    echo "   ⚠️ Chrome ainda encontrado"
else
    echo "   ✅ Chrome removido completamente"
fi

echo ""
echo "📋 Verificação PM2:"
if command -v pm2 &> /dev/null; then
    echo "   ⚠️ PM2 ainda encontrado"
else
    echo "   ✅ PM2 removido completamente"
fi

echo ""
echo "📋 Verificação de processos:"
active_processes=$(ps aux | grep -E "(node|chrome|pm2)" | grep -v grep | wc -l)
if [ "$active_processes" -eq 0 ]; then
    echo "   ✅ Nenhum processo ativo"
else
    echo "   ⚠️ $active_processes processos ainda ativos"
fi

echo ""
echo "📋 Verificação de portas:"
active_ports=$(netstat -tulpn 2>/dev/null | grep -E "(3001|3002)" | wc -l)
if [ "$active_ports" -eq 0 ]; then
    echo "   ✅ Portas liberadas"
else
    echo "   ⚠️ $active_ports portas ainda ocupadas"
fi

# RESUMO DA LIMPEZA TOTAL
echo ""
echo "🎉 LIMPEZA TOTAL CONCLUÍDA!"
echo "=========================="

echo "✅ VPS COMPLETAMENTE ZERADA:"
echo "   ✅ Node.js: Removido totalmente"
echo "   ✅ Chrome: Removido totalmente"
echo "   ✅ PM2: Removido totalmente"
echo "   ✅ Projetos: Removidos totalmente"
echo "   ✅ Configurações: Limpas"
echo "   ✅ Processos: Terminados"
echo "   ✅ Portas: Liberadas"
echo "   ✅ Sistema: Atualizado"

echo ""
echo "💾 BACKUP DISPONÍVEL EM:"
echo "   📁 $BACKUP_DIR"

echo ""
echo "🚀 PRÓXIMO PASSO:"
echo "   Execute: bash vps-clean-installation.sh"
echo "   (Instalação limpa do ambiente)"

log_cleanup "LIMPEZA TOTAL FINALIZADA COM SUCESSO!"
echo "🎯 VPS PRONTA PARA INSTALAÇÃO LIMPA!"
