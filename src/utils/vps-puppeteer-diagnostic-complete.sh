
#!/bin/bash

# DIAGNÓSTICO COMPLETO PUPPETEER - Análise Profunda
echo "🔍 DIAGNÓSTICO COMPLETO PUPPETEER/CHROME - VPS"
echo "=============================================="

VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"

echo "📋 Configuração da VPS:"
echo "   IP: $VPS_IP"
echo "   Porta: $PORTA"
echo "   Data: $(date)"

# 1. DIAGNÓSTICO COMPLETO DO SISTEMA
echo ""
echo "🔍 FASE 1: DIAGNÓSTICO COMPLETO DO SISTEMA"
echo "=========================================="

echo "📊 Verificando recursos da VPS:"
echo "   💾 Memória RAM:"
free -h | head -2

echo "   💽 Espaço em disco:"
df -h | grep -E '(Filesystem|/$)'

echo "   🖥️ Processador:"
nproc
lscpu | grep "Model name" | head -1

echo ""
echo "🌐 Verificando Chrome/Chromium disponível:"

# Verificar Chrome
if command -v google-chrome &> /dev/null; then
    echo "   ✅ Google Chrome encontrado:"
    google-chrome --version 2>/dev/null || echo "   ⚠️ Chrome não executa"
else
    echo "   ❌ Google Chrome não encontrado"
fi

if command -v google-chrome-stable &> /dev/null; then
    echo "   ✅ Google Chrome Stable encontrado:"
    google-chrome-stable --version 2>/dev/null || echo "   ⚠️ Chrome Stable não executa"
else
    echo "   ❌ Google Chrome Stable não encontrado"
fi

if command -v chromium-browser &> /dev/null; then
    echo "   ✅ Chromium encontrado:"
    chromium-browser --version 2>/dev/null || echo "   ⚠️ Chromium não executa"
else
    echo "   ❌ Chromium não encontrado"
fi

echo ""
echo "🧪 TESTE CHROME HEADLESS ISOLADO:"
echo "================================="

# Testar Chrome headless conforme sugestão do usuário
echo "🧪 Testando Chrome headless com flags reais..."
timeout 15s google-chrome-stable --headless --disable-gpu --no-sandbox --remote-debugging-port=9222 https://google.com &
CHROME_PID=$!

sleep 5
if ps -p $CHROME_PID > /dev/null; then
    echo "✅ Chrome headless iniciou com sucesso"
    kill $CHROME_PID 2>/dev/null
else
    echo "❌ Chrome headless falhou ao iniciar"
fi

echo ""
echo "📋 Verificando logs do sistema:"
echo "   🔍 Journal errors (últimas 10 linhas):"
journalctl -xe --no-pager | tail -10 | grep -i error || echo "   ✅ Nenhum erro recente no journal"

echo "   🔍 Kernel messages (últimas 5 linhas):"
dmesg | tail -5 | grep -i error || echo "   ✅ Nenhum erro recente no kernel"

# Verificar dependências do Chrome
echo ""
echo "🔗 Verificando dependências do Chrome:"
if command -v google-chrome-stable &> /dev/null; then
    echo "   📋 Bibliotecas do Chrome:"
    ldd /usr/bin/google-chrome-stable | grep "not found" || echo "   ✅ Todas as dependências encontradas"
else
    echo "   ⚠️ Chrome não encontrado para verificar dependências"
fi

echo ""
echo "🎯 RESULTADO DO DIAGNÓSTICO:"
echo "============================"

echo "📊 Sistema:"
echo "   RAM: $(free -h | awk 'NR==2{printf \"%.1fG usado / %.1fG total (%.0f%%)\", $3/1024/1024, $2/1024/1024, $3*100/$2 }')"
echo "   Disco: $(df -h / | awk 'NR==2{print $3 \" usado / \" $2 \" total (\" $5 \")\"}')"

if command -v google-chrome-stable &> /dev/null; then
    echo "   Chrome: ✅ Disponível"
else
    echo "   Chrome: ❌ Não disponível"
fi

echo ""
echo "🚀 PRÓXIMOS PASSOS SUGERIDOS:"
echo "1. Instalar/atualizar Chrome e dependências"
echo "2. Testar Puppeteer isoladamente" 
echo "3. Aplicar configuração corrigida no servidor"
echo "4. Validar funcionamento completo"

echo ""
echo "🎯 Execute o próximo script: ./vps-puppeteer-fix-definitivo.sh"
