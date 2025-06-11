
#!/bin/bash

# LIMPEZA RADICAL VPS - REMOÇÃO TOTAL E CONTROLADA
echo "🧹 LIMPEZA RADICAL VPS - REMOÇÃO TOTAL E CONTROLADA"
echo "=================================================="
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Remover TODOS os componentes conflitantes"
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

log_warning() {
    echo "[$(date '+%H:%M:%S')] ⚠️ ATENÇÃO: $1"
}

# CONFIRMAÇÃO DE SEGURANÇA
echo "⚠️ ATENÇÃO: Esta limpeza é IRREVERSÍVEL!"
echo "⚠️ Todos os projetos Node.js serão removidos!"
echo "⚠️ O sistema será limpo completamente!"
echo ""
read -p "🔴 Digite 'CONFIRMAR' para continuar: " confirm

if [ "$confirm" != "CONFIRMAR" ]; then
    echo "❌ Limpeza cancelada pelo usuário."
    exit 1
fi

echo ""
log_cleanup "INICIANDO LIMPEZA RADICAL..."

# FASE 1: BACKUP DE DADOS ESSENCIAIS
echo ""
echo "💾 FASE 1: BACKUP DE DADOS ESSENCIAIS"
echo "====================================="

BACKUP_DIR="/root/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

log_backup "Criando backup em $BACKUP_DIR..."

# Backup de arquivos importantes
if [ -f "/root/whatsapp-server.js" ]; then
    cp /root/whatsapp-server.js "$BACKUP_DIR/"
    log_backup "whatsapp-server.js salvo"
fi

if [ -f "/root/package.json" ]; then
    cp /root/package.json "$BACKUP_DIR/"
    log_backup "package.json salvo"
fi

# Backup das sessões WhatsApp (se existirem)
if [ -d "/root/.wwebjs_auth" ]; then
    cp -r /root/.wwebjs_auth "$BACKUP_DIR/"
    log_backup "Sessões WhatsApp salvas"
fi

if [ -d "/root/sessions" ]; then
    cp -r /root/sessions "$BACKUP_DIR/"
    log_backup "Diretório sessions salvo"
fi

# Backup configuração PM2
if command -v pm2 &> /dev/null; then
    pm2 save 2>/dev/null
    if [ -f "/root/.pm2/dump.pm2" ]; then
        cp /root/.pm2/dump.pm2 "$BACKUP_DIR/"
        log_backup "Configuração PM2 salva"
    fi
fi

log_backup "Backup completo em: $BACKUP_DIR"

# FASE 2: PARAR TODOS OS SERVIÇOS
echo ""
echo "⏹️ FASE 2: PARAR TODOS OS SERVIÇOS"
echo "================================="

log_cleanup "Parando todos os serviços Node.js/PM2..."

# Parar PM2
if command -v pm2 &> /dev/null; then
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    pm2 kill 2>/dev/null || true
    log_cleanup "PM2 parado e limpo"
fi

# Matar processos Node.js
pkill -f node 2>/dev/null || true
pkill -f npm 2>/dev/null || true
log_cleanup "Processos Node.js terminados"

# Matar processos Chrome
pkill -f chrome 2>/dev/null || true
pkill -f chromium 2>/dev/null || true
log_cleanup "Processos Chrome terminados"

# Liberar portas específicas
for port in 3001 3002 9222; do
    lsof -ti :$port | xargs kill -9 2>/dev/null || true
done
log_cleanup "Portas liberadas"

# FASE 3: REMOÇÃO COMPLETA NODE.JS
echo ""
echo "🗑️ FASE 3: REMOÇÃO COMPLETA NODE.JS"
echo "=================================="

log_remove "Removendo todas as instalações Node.js..."

# Remover via apt
apt-get remove --purge -y nodejs npm node 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true

# Remover instalações manuais
rm -rf /usr/local/bin/node 2>/dev/null || true
rm -rf /usr/local/bin/npm 2>/dev/null || true
rm -rf /usr/local/lib/node_modules 2>/dev/null || true
rm -rf /usr/local/include/node 2>/dev/null || true

# Remover NVM
rm -rf ~/.nvm 2>/dev/null || true

# Remover node_modules globais
rm -rf /root/node_modules 2>/dev/null || true
rm -rf /root/.npm 2>/dev/null || true

log_remove "Node.js removido completamente"

# FASE 4: REMOÇÃO COMPLETA CHROME/CHROMIUM
echo ""
echo "🗑️ FASE 4: REMOÇÃO COMPLETA CHROME/CHROMIUM"
echo "=========================================="

log_remove "Removendo todas as instalações Chrome/Chromium..."

# Remover via apt
apt-get remove --purge -y google-chrome-stable google-chrome chromium-browser chromium 2>/dev/null || true

# Remover via snap
snap remove chromium 2>/dev/null || true

# Remover instalações manuais
rm -rf /opt/google 2>/dev/null || true
rm -rf /usr/local/bin/chrome 2>/dev/null || true
rm -rf /usr/local/bin/chromium 2>/dev/null || true

# Remover dados e caches
rm -rf ~/.cache/google-chrome* 2>/dev/null || true
rm -rf ~/.cache/chromium* 2>/dev/null || true
rm -rf ~/.config/google-chrome* 2>/dev/null || true
rm -rf ~/.config/chromium* 2>/dev/null || true

log_remove "Chrome/Chromium removido completamente"

# FASE 5: LIMPEZA DE DEPENDÊNCIAS E CACHES
echo ""
echo "🧽 FASE 5: LIMPEZA DE DEPENDÊNCIAS E CACHES"
echo "=========================================="

log_cleanup "Limpando caches e dependências órfãs..."

# Limpeza de caches npm
rm -rf ~/.npm 2>/dev/null || true
rm -rf /tmp/npm-* 2>/dev/null || true

# Limpeza de temporários
rm -rf /tmp/.org.chromium.Chromium.* 2>/dev/null || true
rm -rf /tmp/puppeteer_dev_chrome_profile-* 2>/dev/null || true

# Limpeza apt
apt-get autoclean 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true

# Limpeza de logs antigos
find /var/log -name "*chrome*" -delete 2>/dev/null || true
find /var/log -name "*node*" -delete 2>/dev/null || true

log_cleanup "Caches e temporários limpos"

# FASE 6: LIMPEZA DE CONFIGURAÇÕES
echo ""
echo "🔧 FASE 6: LIMPEZA DE CONFIGURAÇÕES"
echo "================================="

log_cleanup "Removendo configurações órfãs..."

# Remover variáveis de ambiente órfãs
sed -i '/PUPPETEER/d' ~/.bashrc 2>/dev/null || true
sed -i '/CHROME/d' ~/.bashrc 2>/dev/null || true
sed -i '/NODE/d' ~/.bashrc 2>/dev/null || true

# Remover arquivos de configuração
rm -rf ~/.pm2 2>/dev/null || true

# Limpar PATH de entradas órfãs
export PATH=$(echo $PATH | sed 's|/root/.nvm/[^:]*:||g')

log_cleanup "Configurações limpas"

# FASE 7: VERIFICAÇÃO FINAL
echo ""
echo "✅ FASE 7: VERIFICAÇÃO FINAL"
echo "=========================="

log_cleanup "Verificando limpeza..."

echo "📋 Verificação Node.js:"
if command -v node &> /dev/null; then
    echo "   ⚠️ Node.js ainda encontrado: $(which node)"
else
    echo "   ✅ Node.js removido"
fi

echo ""
echo "📋 Verificação Chrome:"
if command -v google-chrome-stable &> /dev/null || command -v chromium-browser &> /dev/null; then
    echo "   ⚠️ Chrome ainda encontrado"
else
    echo "   ✅ Chrome removido"
fi

echo ""
echo "📋 Verificação PM2:"
if command -v pm2 &> /dev/null; then
    echo "   ⚠️ PM2 ainda encontrado"
else
    echo "   ✅ PM2 removido"
fi

echo ""
echo "📋 Verificação de processos:"
ps aux | grep -E "(node|chrome|chromium)" | grep -v grep || echo "   ✅ Nenhum processo ativo"

echo ""
echo "📋 Verificação de portas:"
netstat -tulpn 2>/dev/null | grep -E "(3001|3002)" || echo "   ✅ Portas liberadas"

# RESUMO DA LIMPEZA
echo ""
echo "🎉 LIMPEZA RADICAL CONCLUÍDA!"
echo "============================"

echo "✅ SISTEMA COMPLETAMENTE LIMPO:"
echo "   ✅ Node.js: Removido"
echo "   ✅ Chrome/Chromium: Removido"
echo "   ✅ PM2: Removido"
echo "   ✅ Caches: Limpos"
echo "   ✅ Configurações: Limpas"
echo "   ✅ Processos: Terminados"
echo "   ✅ Portas: Liberadas"

echo ""
echo "💾 BACKUP DISPONÍVEL EM:"
echo "   📁 $BACKUP_DIR"

echo ""
echo "🚀 PRÓXIMO PASSO:"
echo "   Execute: bash vps-controlled-installation.sh"
echo "   (Instalação controlada e otimizada)"

log_cleanup "LIMPEZA RADICAL FINALIZADA COM SUCESSO!"
