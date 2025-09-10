#!/bin/bash

# MONITORAMENTO DE RESTARTS - Detecção de loops infinitos
# Execute este script para monitorar a estabilidade do servidor

echo "🔍 MONITORAMENTO DE RESTARTS - Detecção de Loops"
echo "==============================================="
echo

# Função para obter contagem de restarts
get_restart_count() {
    pm2 show whatsapp-server | grep "restarts" | awk '{print $3}' | tr -d '│'
}

# Função para obter uptime
get_uptime() {
    pm2 show whatsapp-server | grep "uptime" | awk '{print $3}' | tr -d '│'
}

# Função para obter status
get_status() {
    pm2 show whatsapp-server | grep "status" | awk '{print $3}' | tr -d '│'
}

# Função para obter memória
get_memory() {
    pm2 list | grep whatsapp-server | awk '{print $8}'
}

echo "📊 MONITORAMENTO INICIAL"
echo "======================="
initial_restarts=$(get_restart_count)
initial_time=$(date)
echo "🕐 Hora inicial: $initial_time"
echo "🔄 Restarts iniciais: $initial_restarts"
echo "📈 Status: $(get_status)"
echo "💾 Memória: $(get_memory)"
echo

echo "🔍 MONITORAMENTO CONTÍNUO (60 segundos)"
echo "======================================"
echo "Formato: [Hora] Restarts: X | Status: Y | Memória: Z"
echo

# Monitorar por 60 segundos
for i in {1..60}; do
    current_restarts=$(get_restart_count)
    current_status=$(get_status)
    current_memory=$(get_memory)
    current_time=$(date +%H:%M:%S)
    
    echo "[$current_time] Restarts: $current_restarts | Status: $current_status | Memória: $current_memory"
    
    # Verificar se houve restart
    if [ "$current_restarts" -gt "$initial_restarts" ]; then
        echo "⚠️  RESTART DETECTADO! Restarts: $initial_restarts → $current_restarts"
        
        # Mostrar logs do restart
        echo "📝 Logs do restart:"
        pm2 logs whatsapp-server --lines 10
        echo
        
        # Atualizar contagem inicial
        initial_restarts=$current_restarts
    fi
    
    # Verificar se está offline
    if [ "$current_status" != "online" ]; then
        echo "🔴 SERVIDOR OFFLINE! Status: $current_status"
    fi
    
    sleep 1
done

echo
echo "📊 RESUMO DO MONITORAMENTO"
echo "========================="
final_restarts=$(get_restart_count)
final_time=$(date)
restart_diff=$((final_restarts - initial_restarts))

echo "🕐 Hora final: $final_time"
echo "🔄 Restarts finais: $final_restarts"
echo "📈 Diferença de restarts: $restart_diff"
echo "📊 Status final: $(get_status)"
echo "💾 Memória final: $(get_memory)"
echo

if [ "$restart_diff" -eq 0 ]; then
    echo "✅ SERVIDOR ESTÁVEL - Nenhum restart detectado"
elif [ "$restart_diff" -le 2 ]; then
    echo "⚠️  SERVIDOR PARCIALMENTE ESTÁVEL - Poucos restarts ($restart_diff)"
else
    echo "🚨 SERVIDOR INSTÁVEL - Muitos restarts ($restart_diff)"
    echo "🔍 Investigando causa dos restarts..."
    
    # Mostrar logs de erro
    echo "📝 Logs de erro recentes:"
    pm2 logs whatsapp-server --lines 20 | grep -E "(error|Error|crash|exit|Exception)"
    
    # Verificar loops infinitos
    echo "🔄 Verificando loops infinitos:"
    pm2 logs whatsapp-server --lines 30 | grep -E "(reconnect|reconexão|close|connecting)" | tail -10
fi

echo
echo "🎯 RECOMENDAÇÕES"
echo "==============="
if [ "$restart_diff" -gt 3 ]; then
    echo "🚨 AÇÃO NECESSÁRIA:"
    echo "   1. Remover instâncias problemáticas"
    echo "   2. Aplicar correção anti-loop"
    echo "   3. Reiniciar servidor limpo"
    echo
    echo "📋 Comandos para correção:"
    echo "   rm -rf /root/whatsapp-server/auth_info/*"
    echo "   pm2 restart whatsapp-server"
elif [ "$restart_diff" -gt 0 ]; then
    echo "⚠️  MONITORAR MAIS:"
    echo "   Execute novamente em 5 minutos"
    echo "   Verifique logs específicos"
else
    echo "✅ SERVIDOR SAUDÁVEL:"
    echo "   Pode prosseguir com testes"
    echo "   Webhooks podem ser testados"
fi

echo
echo "🔄 Para monitoramento contínuo:"
echo "   watch -n 2 'pm2 status whatsapp-server'"
echo
echo "📊 Para logs em tempo real:"
echo "   pm2 logs whatsapp-server --lines 0" 