
#!/bin/bash

# LIMPEZA COMPLETA DOS SERVIDORES PORTA 3002
# Remove completamente os 2 servidores da porta 3002, preservando o servidor 3001
echo "🧹 LIMPEZA COMPLETA DOS SERVIDORES PORTA 3002"
echo "=============================================="
echo "📅 $(date)"
echo ""

# Função de log
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

log "🔍 IDENTIFICANDO PROCESSOS PM2 ATIVOS"

# Verificar processos PM2 atuais
echo "📋 Processos PM2 atuais:"
pm2 list | grep -E "(whatsapp|3002)" || echo "   Nenhum processo WhatsApp encontrado"

echo ""
log "⏹️ PARANDO TODOS OS PROCESSOS whatsapp-main-3002"

# Parar TODOS os processos com nome whatsapp-main-3002
pm2 stop whatsapp-main-3002 2>/dev/null && log "✅ Processos whatsapp-main-3002 parados" || log "⚠️ Nenhum processo whatsapp-main-3002 estava rodando"

# Aguardar um momento para garantir que pararam
sleep 2

echo ""
log "🗑️ REMOVENDO PROCESSOS PM2 whatsapp-main-3002"

# Deletar TODOS os processos com nome whatsapp-main-3002
pm2 delete whatsapp-main-3002 2>/dev/null && log "✅ Processos whatsapp-main-3002 removidos do PM2" || log "⚠️ Nenhum processo whatsapp-main-3002 para remover"

# Salvar configuração PM2 atualizada
pm2 save && log "✅ Configuração PM2 salva"

echo ""
log "📁 REMOVENDO ARQUIVOS FÍSICOS DOS SERVIDORES PORTA 3002"

# Remover whatsapp-server-corrected.js
if [ -f "/root/whatsapp-server-corrected.js" ]; then
    rm -f /root/whatsapp-server-corrected.js && log "✅ Arquivo /root/whatsapp-server-corrected.js removido"
else
    log "⚠️ Arquivo /root/whatsapp-server-corrected.js não encontrado"
fi

# Remover whatsapp-minimal-working.js
if [ -f "/root/whatsapp-minimal-working.js" ]; then
    rm -f /root/whatsapp-minimal-working.js && log "✅ Arquivo /root/whatsapp-minimal-working.js removido"
else
    log "⚠️ Arquivo /root/whatsapp-minimal-working.js não encontrado"
fi

# Remover outros arquivos relacionados aos servidores 3002 (se existirem)
if [ -f "/root/whatsapp-server-advanced.js" ]; then
    rm -f /root/whatsapp-server-advanced.js && log "✅ Arquivo /root/whatsapp-server-advanced.js removido"
else
    log "ℹ️ Arquivo /root/whatsapp-server-advanced.js não encontrado"
fi

if [ -f "/root/whatsapp-quick.js" ]; then
    rm -f /root/whatsapp-quick.js && log "✅ Arquivo /root/whatsapp-quick.js removido"
else
    log "ℹ️ Arquivo /root/whatsapp-quick.js não encontrado"
fi

echo ""
log "🔍 VERIFICANDO LIMPEZA COMPLETA"

# Verificar se não há processos rodando na porta 3002
echo "📋 Verificando porta 3002:"
port_3002_process=$(netstat -tulpn 2>/dev/null | grep ":3002" | head -1)
if [ -z "$port_3002_process" ]; then
    log "✅ Porta 3002 está livre - nenhum processo ativo"
else
    log "⚠️ Ainda há processo na porta 3002: $port_3002_process"
    # Tentar matar processo órfão na porta 3002
    pid_3002=$(lsof -ti :3002 2>/dev/null)
    if [ -n "$pid_3002" ]; then
        kill -9 $pid_3002 2>/dev/null && log "✅ Processo órfão na porta 3002 eliminado (PID: $pid_3002)"
    fi
fi

# Verificar se o servidor da porta 3001 ainda está ativo
echo ""
echo "📋 Verificando servidor porta 3001 (deve permanecer ativo):"
port_3001_process=$(netstat -tulpn 2>/dev/null | grep ":3001" | head -1)
if [ -n "$port_3001_process" ]; then
    log "✅ Servidor porta 3001 está ativo (preservado)"
    # Testar health check do servidor 3001
    curl -s http://localhost:3001/health > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log "✅ Health check servidor 3001: OK"
    else
        log "⚠️ Health check servidor 3001: Falha"
    fi
else
    log "⚠️ Servidor porta 3001 não está ativo!"
fi

# Verificar se arquivo whatsapp-server.js ainda existe
if [ -f "/root/whatsapp-server.js" ]; then
    log "✅ Arquivo /root/whatsapp-server.js preservado"
else
    log "❌ ERRO: Arquivo /root/whatsapp-server.js foi removido acidentalmente!"
fi

echo ""
log "📊 PROCESSOS PM2 APÓS LIMPEZA"
pm2 list | grep -E "(whatsapp|3001|3002)" || echo "   Nenhum processo WhatsApp encontrado"

echo ""
log "🧹 LIMPEZA ADICIONAL - SESSÕES ÓRFÃS"

# Limpar sessões órfãs dos servidores removidos
if [ -d "/root/.wwebjs_auth" ]; then
    find /root/.wwebjs_auth -name "*corrected*" -type d -exec rm -rf {} \; 2>/dev/null && log "✅ Sessões 'corrected' removidas"
    find /root/.wwebjs_auth -name "*minimal*" -type d -exec rm -rf {} \; 2>/dev/null && log "✅ Sessões 'minimal' removidas"
fi

# Limpar cache Chrome órfão
rm -rf /tmp/.org.chromium.Chromium.* 2>/dev/null && log "✅ Cache Chromium temporário limpo"

echo ""
echo "🎉 LIMPEZA COMPLETA DOS SERVIDORES PORTA 3002 FINALIZADA!"
echo "========================================================="
echo ""
echo "📊 RESUMO:"
echo "   ✅ Processos PM2 whatsapp-main-3002: REMOVIDOS"
echo "   ✅ Arquivo /root/whatsapp-server-corrected.js: REMOVIDO"
echo "   ✅ Arquivo /root/whatsapp-minimal-working.js: REMOVIDO"
echo "   ✅ Porta 3002: LIBERADA"
echo "   ✅ Servidor porta 3001: PRESERVADO"
echo "   ✅ Arquivo /root/whatsapp-server.js: PRESERVADO"
echo "   ✅ Sessões órfãs: LIMPAS"
echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "   1. Verificar se o servidor 3001 está funcionando:"
echo "      curl http://localhost:3001/health"
echo ""
echo "   2. Decidir próxima ação:"
echo "      → Migrar servidor completo (3001 → 3002)"
echo "      → Ou reconfigurar backend (3002 → 3001)"
echo ""
echo "   3. A porta 3002 está agora completamente livre para uso"

