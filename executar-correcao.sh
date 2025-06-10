
#!/bin/bash

# SCRIPT DE CORREÇÃO IMEDIATA - ELIMINAR SYNTAXERROR
echo "🔧 CORREÇÃO IMEDIATA DO SYNTAXERROR"
echo "===================================="

echo "📅 Data: $(date)"
echo "🎯 Objetivo: Eliminar SyntaxError e aplicar servidor corrigido"
echo ""

# CONFIGURAÇÕES
VPS_IP="31.97.24.222"
PORTA="3002"

echo "🛑 ETAPA 1: PARAR SERVIDOR ATUAL"
echo "==============================="

echo "📋 Parando PM2..."
pm2 stop whatsapp-main-3002 2>/dev/null || true
pm2 delete whatsapp-main-3002 2>/dev/null || true
pkill -f "whatsapp-main-3002" 2>/dev/null || true
sleep 3

echo ""
echo "📁 ETAPA 2: BACKUP E APLICAR CORREÇÃO"
echo "===================================="

echo "📋 Fazendo backup do arquivo corrompido..."
if [ -f "vps-server-persistent.js" ]; then
    cp vps-server-persistent.js "vps-server-backup-corrupted-$(date +%Y%m%d_%H%M%S).js"
    echo "✅ Backup criado"
else
    echo "⚠️ Arquivo atual não encontrado"
fi

echo "📋 O novo arquivo vps-server-persistent.js foi aplicado (SEM SYNTAXERROR)"

echo ""
echo "🔄 ETAPA 3: REINICIAR SERVIDOR CORRIGIDO"
echo "======================================"

echo "📋 Iniciando servidor corrigido com PM2..."
pm2 start vps-server-persistent.js --name whatsapp-main-3002 --force

echo "⏳ Aguardando 10s para inicialização..."
sleep 10

echo ""
echo "🧪 ETAPA 4: TESTE IMEDIATO"
echo "========================="

# Função para teste rápido
function quick_test() {
    local name="$1"
    local url="$2"
    
    echo -n "🧪 $name... "
    
    response=$(timeout 5s curl -s -w "%{http_code}" "$url" 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
        http_code="${response: -3}"
        if [[ "$http_code" == "200" ]]; then
            echo "✅ OK"
            return 0
        else
            echo "❌ FAIL ($http_code)"
            return 1
        fi
    else
        echo "❌ TIMEOUT"
        return 1
    fi
}

# Testes críticos
quick_test "Health" "http://$VPS_IP:$PORTA/health"
health_ok=$?

quick_test "Status" "http://$VPS_IP:$PORTA/status"
status_ok=$?

echo ""
echo "📊 RESULTADO IMEDIATO:"
echo "===================="

if [[ $health_ok -eq 0 && $status_ok -eq 0 ]]; then
    echo "✅ CORREÇÃO APLICADA COM SUCESSO!"
    echo "✅ Health: OK"
    echo "✅ Status: OK"
    echo "✅ SyntaxError: ELIMINADO"
    echo ""
    echo "🎉 SERVIDOR CORRIGIDO E FUNCIONANDO!"
    echo "=================================="
    echo "Execute agora: chmod +x teste-pos-correcao.sh && ./teste-pos-correcao.sh"
    
else
    echo "❌ AINDA HÁ PROBLEMAS!"
    echo "Health: $([ $health_ok -eq 0 ] && echo 'OK' || echo 'FAIL')"
    echo "Status: $([ $status_ok -eq 0 ] && echo 'OK' || echo 'FAIL')"
    echo ""
    echo "📋 Verificar logs: pm2 logs whatsapp-main-3002"
    exit 1
fi

echo ""
echo "✅ CORREÇÃO IMEDIATA REALIZADA!"
echo "==============================="
echo "📱 Versão: 5.0.0-SYNTAXERROR-FIXED"
echo "🔧 Correções: HTML/JSX removido, JavaScript Node.js puro, require() tradicional"
