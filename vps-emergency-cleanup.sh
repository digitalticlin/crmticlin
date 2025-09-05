#!/bin/bash

# 🚨 LIMPEZA EMERGENCIAL - VPS ENDPOINTS FALHANDO
echo "🚨 LIMPEZA EMERGENCIAL DA VPS - TODOS ENDPOINTS FALHARAM"
echo "Data: $(date)"
echo "================================================="

echo ""
echo "🗑️ 1. LIMPEZA DIRETA NO FILESYSTEM"
echo "================================================="

echo "📁 Removendo instância digitalticlin completamente:"
rm -rf /root/whatsapp-server/auth_info/digitalticlin
echo "✅ auth_info/digitalticlin removido"

echo ""
echo "📁 Verificando se existem outras referências:"
find /root/whatsapp-server -name "*digitalticlin*" -type f 2>/dev/null
find /root/whatsapp-server -name "*digitalticlin*" -type d 2>/dev/null

echo ""
echo "🧠 2. LIMPEZA NA MEMÓRIA (CONNECTIONMANAGER)"
echo "================================================="

echo "🔄 Reiniciando whatsapp-server para limpar memória:"
pm2 restart whatsapp-server

echo "⏳ Aguardando 10 segundos..."
sleep 10

echo "📊 Status pós-restart:"
pm2 status | grep whatsapp-server

echo ""
echo "🔍 3. VERIFICAÇÃO DOS ENDPOINTS VPS"
echo "================================================="

echo "🧪 Testando conectividade com os endpoints que falharam:"

echo ""
echo "1️⃣ Teste DELETE padrão:"
curl -s -X DELETE "http://localhost:3001/instance/digitalticlin" \
  -H "Content-Type: application/json" \
  --max-time 5 || echo "❌ Endpoint não responde"

echo ""
echo "2️⃣ Teste Health Check:"
curl -s "http://localhost:3001/health" --max-time 5 || echo "❌ Health Check falhou"

echo ""
echo "3️⃣ Teste conexão VPS geral:"
curl -s "http://localhost:3001/" --max-time 5 || echo "❌ VPS não responde"

echo ""
echo "🔍 4. INVESTIGAÇÃO DOS LOGS VPS"
echo "================================================="

echo "📋 Logs recentes do whatsapp-server:"
pm2 logs whatsapp-server --lines 10 --nostream

echo ""
echo "📋 Erros específicos:"
pm2 logs whatsapp-server --lines 50 --nostream | grep -E "(error|Error|ERROR|ECONNREFUSED|timeout)" | tail -5

echo ""
echo "🌐 5. VERIFICAÇÃO DE REDE E PORTA"
echo "================================================="

echo "📡 Verificando se porta 3001 está ativa:"
netstat -tlnp | grep :3001 || echo "❌ Porta 3001 não está em uso"

echo ""
echo "🔍 Verificando processos Node.js:"
ps aux | grep node | grep -v grep

echo ""
echo "📊 6. DIAGNÓSTICO FINAL"
echo "================================================="

INSTANCES_REMAINING=$(ls -la /root/whatsapp-server/auth_info/ | grep digitalticlin | wc -l)
echo "📁 Instâncias digitalticlin* restantes: $INSTANCES_REMAINING"

if [ $INSTANCES_REMAINING -eq 0 ]; then
    echo "✅ FILESYSTEM: Limpo"
else
    echo "❌ FILESYSTEM: Ainda há $INSTANCES_REMAINING instâncias"
fi

VPS_RESPONDING=$(curl -s "http://localhost:3001/health" >/dev/null && echo "SIM" || echo "NÃO")
echo "🌐 VPS respondendo: $VPS_RESPONDING"

PROCESS_RUNNING=$(pm2 list | grep whatsapp-server | grep -c online)
echo "🚀 Processo ativo: $PROCESS_RUNNING"

echo ""
echo "🎯 RESULTADO:"
if [ $INSTANCES_REMAINING -eq 0 ] && [ "$VPS_RESPONDING" = "SIM" ]; then
    echo "✅ LIMPEZA EMERGENCIAL BEM-SUCEDIDA!"
    echo "🚀 VPS deve aceitar novas criações agora"
else
    echo "⚠️ PROBLEMAS PERSISTEM:"
    [ $INSTANCES_REMAINING -gt 0 ] && echo "   - Instâncias ainda existem no filesystem"
    [ "$VPS_RESPONDING" != "SIM" ] && echo "   - VPS não está respondendo adequadamente"
fi

echo ""
echo "📋 PRÓXIMOS PASSOS RECOMENDADOS:"
echo "   1. Verificar logs detalhados: pm2 logs whatsapp-server"
echo "   2. Reiniciar PM2 completamente se necessário: pm2 restart all"
echo "   3. Verificar configuração de rede da VPS"
echo ""
echo "✅ LIMPEZA EMERGENCIAL CONCLUÍDA!"