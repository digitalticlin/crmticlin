
#!/bin/bash

# LIMPEZA RÁPIDA VPS - PROCESSOS ÓRFÃOS
echo "🧹 LIMPEZA RÁPIDA VPS - PROCESSOS ÓRFÃOS"
echo "======================================="

echo "📅 Data: $(date)"
echo ""

echo "🔍 VERIFICANDO PROCESSOS CHROME ÓRFÃOS"
echo "====================================="

echo "📋 Processos Chrome atuais:"
chrome_processes=$(ps aux | grep -i chrome | grep -v grep | wc -l)
echo "   Total de processos Chrome: $chrome_processes"

if [ "$chrome_processes" -gt 0 ]; then
    echo ""
    echo "📋 Detalhes dos processos Chrome:"
    ps aux | grep -i chrome | grep -v grep | head -10
    
    echo ""
    echo "🧹 REMOVENDO PROCESSOS CHROME ÓRFÃOS"
    echo "===================================="
    
    # Matar processos Chrome órfãos (cuidadosamente)
    pkill -f "chrome.*--remote-debugging" 2>/dev/null && echo "✅ Processos Chrome com remote-debugging removidos"
    pkill -f "chrome.*--headless" 2>/dev/null && echo "✅ Processos Chrome headless removidos"
    pkill -f "chrome.*--no-sandbox" 2>/dev/null && echo "✅ Processos Chrome no-sandbox removidos"
    
    # Aguardar um momento para os processos terminarem
    sleep 3
    
    echo ""
    echo "📋 Processos Chrome após limpeza:"
    remaining_chrome=$(ps aux | grep -i chrome | grep -v grep | wc -l)
    echo "   Processos restantes: $remaining_chrome"
    
    if [ "$remaining_chrome" -gt 0 ]; then
        echo "⚠️ Ainda há $remaining_chrome processos Chrome ativos"
        ps aux | grep -i chrome | grep -v grep | head -5
    else
        echo "✅ Todos os processos Chrome órfãos removidos"
    fi
else
    echo "✅ Nenhum processo Chrome órfão encontrado"
fi

echo ""
echo "🔍 VERIFICANDO CACHE CHROME"
echo "=========================="

echo "📋 Limpando cache Chrome/Chromium..."
rm -rf ~/.cache/google-chrome/* 2>/dev/null && echo "✅ Cache Google Chrome limpo"
rm -rf ~/.cache/chromium/* 2>/dev/null && echo "✅ Cache Chromium limpo"
rm -rf /tmp/.org.chromium.Chromium.* 2>/dev/null && echo "✅ Arquivos temporários Chromium removidos"

echo ""
echo "🔍 VERIFICANDO SESSÕES WHATSAPP ÓRFÃS"
echo "==================================="

echo "📋 Limpando sessões WhatsApp órfãs..."
rm -rf ./.wwebjs_auth/* 2>/dev/null && echo "✅ Sessões .wwebjs_auth limpas"
rm -rf ./whatsapp_instances/.* 2>/dev/null && echo "✅ Arquivos ocultos em whatsapp_instances removidos"

# Remover arquivos de lock órfãos
find ./whatsapp_instances -name "*.lock" -delete 2>/dev/null && echo "✅ Arquivos .lock removidos"
find ./whatsapp_instances -name "singleton_lock" -delete 2>/dev/null && echo "✅ Arquivos singleton_lock removidos"

echo ""
echo "🔍 VERIFICANDO RECURSOS DO SISTEMA"
echo "================================="

echo "📋 Uso de memória:"
free -h | head -2

echo ""
echo "📋 Uso de CPU (top 5 processos):"
ps aux --sort=-%cpu | head -6

echo ""
echo "📋 Espaço em disco:"
df -h / | tail -1

echo ""
echo "🔄 REINICIANDO SERVIÇO PM2"
echo "========================="

echo "📋 Reiniciando whatsapp-main-3002..."
pm2 restart whatsapp-main-3002 2>/dev/null || echo "⚠️ Processo não estava rodando"

echo ""
echo "📋 Status do processo após restart:"
pm2 info whatsapp-main-3002 2>/dev/null || echo "⚠️ Processo não encontrado"

echo ""
echo "📋 Últimas 5 linhas do log:"
pm2 logs whatsapp-main-3002 --lines 5 2>/dev/null || echo "⚠️ Sem logs disponíveis"

echo ""
echo "✅ LIMPEZA RÁPIDA CONCLUÍDA!"
echo "=========================="

echo ""
echo "📋 RESUMO:"
echo "   • Processos Chrome órfãos: removidos"
echo "   • Cache navegador: limpo"
echo "   • Sessões WhatsApp órfãs: limpas"
echo "   • Arquivos de lock: removidos"
echo "   • Serviço PM2: reiniciado"

echo ""
echo "📋 PRÓXIMO PASSO:"
echo "   Execute: ./vps-puppeteer-specific-test.sh"
echo "   Para testar se o problema foi resolvido"
