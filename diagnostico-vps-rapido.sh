#!/bin/bash
echo "🔬 DIAGNÓSTICO VPS - CIRÚRGICO"
echo "=============================="

echo ""
echo "=== 1. LOGS PM2 (Últimas 30 linhas) ==="
pm2 logs whatsapp-server --lines 30

echo ""
echo "=== 2. STATUS PM2 ==="
pm2 status

echo ""
echo "=== 3. PORTA 3002 ==="
netstat -tulpn | grep 3002
lsof -i :3002

echo ""
echo "=== 4. SINTAXE SERVER.JS ==="
cd /root/whatsapp-server 2>/dev/null || cd /root/webhook-server-3002 2>/dev/null || echo "Diretório não encontrado"
node -c server.js && echo "✅ Sintaxe OK" || echo "❌ ERRO DE SINTAXE"

echo ""
echo "=== 5. DEPENDÊNCIAS ==="
[ -d "node_modules" ] && echo "✅ node_modules OK" || echo "❌ node_modules FALTANDO"

echo ""
echo "=== 6. PRIMEIRO TESTE: LOGS EM TEMPO REAL ==="
echo "Execute: pm2 logs whatsapp-server --lines 0 -f"
echo "Pressione Ctrl+C após 10 segundos para ver os erros" 