
#!/bin/bash

# DIAGNÓSTICO RÁPIDO - EXECUÇÃO EM SEQUÊNCIA
echo "⚡ DIAGNÓSTICO RÁPIDO VPS - SEQUÊNCIA COMPLETA"
echo "============================================="

echo "📅 Data: $(date)"
echo ""

echo "🏃‍♂️ EXECUTANDO SEQUÊNCIA DIAGNÓSTICA RÁPIDA"
echo "==========================================="

echo ""
echo "PASSO 1/3: LIMPEZA RÁPIDA"
echo "========================="
chmod +x vps-quick-cleanup.sh
./vps-quick-cleanup.sh

echo ""
echo "PASSO 2/3: AGUARDANDO ESTABILIZAÇÃO (10s)"
echo "========================================"
for i in {10..1}; do
    echo -n "$i... "
    sleep 1
done
echo ""

echo ""
echo "PASSO 3/3: TESTE ESPECÍFICO PUPPETEER"
echo "===================================="
chmod +x vps-puppeteer-specific-test.sh
./vps-puppeteer-specific-test.sh

echo ""
echo "🏆 DIAGNÓSTICO RÁPIDO CONCLUÍDO!"
echo "==============================="

echo ""
echo "📊 ANÁLISE FINAL:"
echo "   1. Se ainda trava em 20s: Problema de configuração Puppeteer"
echo "   2. Se passou nos testes: Problema era de recursos/cache"
echo "   3. Se melhorou mas ainda lento: Otimizar timeouts"

echo ""
echo "📋 AÇÕES RECOMENDADAS:"
echo "   • Se travou: Aplicar configuração mais agressiva"
echo "   • Se funcionou: Implementar limpeza automática"
echo "   • Se melhorou: Ajustar timeouts para produção"
