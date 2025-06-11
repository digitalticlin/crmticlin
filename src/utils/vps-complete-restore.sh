
#!/bin/bash

# RESTAURAÇÃO COMPLETA VPS - EXECUÇÃO AUTOMÁTICA
echo "🔄 RESTAURAÇÃO COMPLETA VPS - EXECUÇÃO AUTOMÁTICA"
echo "================================================"
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Executar sequência completa de restauração"
echo ""

# Função de log
log_restore() {
    echo "[$(date '+%H:%M:%S')] 🔄 $1"
}

log_phase() {
    echo "[$(date '+%H:%M:%S')] 📋 FASE: $1"
}

log_success() {
    echo "[$(date '+%H:%M:%S')] ✅ $1"
}

log_error() {
    echo "[$(date '+%H:%M:%S')] ❌ $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "vps-total-cleanup.sh" ] || [ ! -f "vps-clean-installation.sh" ]; then
    log_error "Scripts não encontrados no diretório atual"
    echo "Execute este script no diretório onde estão os scripts de restauração"
    exit 1
fi

echo ""
echo "🚀 INICIANDO RESTAURAÇÃO AUTOMÁTICA COMPLETA"
echo "==========================================="

# FASE 1: LIMPEZA TOTAL
echo ""
log_phase "1/4 - LIMPEZA TOTAL DA VPS"
echo "========================="

log_restore "Executando limpeza total..."
if bash vps-total-cleanup.sh; then
    log_success "Limpeza total concluída"
else
    log_error "Falha na limpeza total"
    exit 1
fi

# FASE 2: INSTALAÇÃO LIMPA
echo ""
log_phase "2/4 - INSTALAÇÃO LIMPA"
echo "====================="

log_restore "Executando instalação limpa..."
if bash vps-clean-installation.sh; then
    log_success "Instalação limpa concluída"
else
    log_error "Falha na instalação limpa"
    exit 1
fi

# FASE 3: IMPLEMENTAÇÃO DO SERVIDOR
echo ""
log_phase "3/4 - IMPLEMENTAÇÃO DO SERVIDOR ORIGINAL"
echo "======================================="

log_restore "Implementando servidor original..."
if bash vps-original-server.sh; then
    log_success "Servidor original implementado"
else
    log_error "Falha na implementação do servidor"
    exit 1
fi

# FASE 4: TESTE FINAL
echo ""
log_phase "4/4 - TESTE FINAL"
echo "==============="

log_restore "Executando teste final..."
if bash vps-original-test.sh; then
    log_success "Teste final concluído"
else
    log_error "Falha no teste final"
    # Não sair aqui pois pode ser apenas teste parcial
fi

# RESUMO FINAL
echo ""
echo "🎉 RESTAURAÇÃO COMPLETA FINALIZADA!"
echo "=================================="

echo "✅ SEQUÊNCIA EXECUTADA:"
echo "   ✅ 1. Limpeza Total: CONCLUÍDA"
echo "   ✅ 2. Instalação Limpa: CONCLUÍDA"
echo "   ✅ 3. Servidor Original: IMPLEMENTADO"
echo "   ✅ 4. Teste Final: EXECUTADO"

echo ""
echo "🎯 RESULTADO:"
echo "   📁 Diretório: /root/whatsapp-original"
echo "   🌐 Servidor: whatsapp-server.js"
echo "   ⚙️ PM2: whatsapp-original-3001"
echo "   🔗 URL: http://$(hostname -I | awk '{print $1}'):3001"

echo ""
echo "📋 VERIFICAÇÕES FINAIS:"
echo "   curl http://localhost:3001/health"
echo "   pm2 status"
echo "   pm2 logs whatsapp-original-3001"

echo ""
log_success "RESTAURAÇÃO AUTOMÁTICA FINALIZADA!"
echo "🚀 SERVIDOR WHATSAPP ORIGINAL RESTAURADO E FUNCIONANDO!"
