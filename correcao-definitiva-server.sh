#!/bin/bash

# CORREÇÃO DEFINITIVA - SERVER.JS VPS
echo "🔧 CORREÇÃO DEFINITIVA - SERVER.JS"
echo "=================================="
echo "📅 $(date)"
echo ""

cd /root/whatsapp-server

echo "=== FASE 1: DIAGNÓSTICO PRECISO ==="
echo ""
echo "1. Verificando qual arquivo o PM2 está executando:"
pm2 show whatsapp-server | grep -E "script path|exec cwd"

echo ""
echo "2. Comparando arquivos disponíveis:"
echo "📁 Arquivos server* encontrados:"
ls -la server*.js

echo ""
echo "3. Verificando requires problemáticos no server.js ativo:"
echo "📋 Procurando por 'diagnostics-manager' e 'import-manager':"
grep -n "diagnostics-manager\|import-manager" server.js || echo "✅ Nenhum require problemático encontrado"

echo ""
echo "4. Primeiras 10 linhas do server.js atual:"
head -10 server.js

echo ""
echo "=== FASE 2: CORREÇÃO AUTOMÁTICA ==="

# Backup de segurança
echo "📦 Criando backup de segurança..."
cp server.js "server-backup-problematico-$(date +%Y%m%d-%H%M%S).js"

# Se existe server-new.js, usar ele
if [ -f "server-new.js" ]; then
    echo "🔄 Substituindo server.js pelo server-new.js..."
    cp server-new.js server.js
    echo "✅ Arquivo substituído"
else
    echo "⚠️ server-new.js não encontrado, mantendo server.js atual"
fi

echo ""
echo "=== FASE 3: REINICIALIZAÇÃO COMPLETA ==="

# Parar processo
echo "🛑 Parando PM2..."
pm2 stop whatsapp-server

# Deletar processo (limpa cache)
echo "🗑️ Removendo processo do PM2 (limpa cache)..."
pm2 delete whatsapp-server

# Aguardar limpeza
echo "⏳ Aguardando limpeza..."
sleep 2

# Iniciar novamente
echo "🚀 Iniciando processo limpo..."
pm2 start server.js --name "whatsapp-server"

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 5

echo ""
echo "=== FASE 4: VALIDAÇÃO COMPLETA ==="

echo "📊 Status PM2:"
pm2 status

echo ""
echo "🏥 Teste de saúde:"
curl -s http://localhost:3002/health | head -10 || echo "❌ Porta ainda inacessível"

echo ""
echo "📋 Teste de status:"
curl -s http://localhost:3002/status | head -10 || echo "❌ Endpoint status inacessível"

echo ""
echo "📝 Logs recentes (últimas 10 linhas):"
pm2 logs whatsapp-server --lines 10

echo ""
echo "=== RESULTADO FINAL ==="
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ SUCESSO! Servidor funcionando na porta 3002"
    echo "🎉 Problema resolvido com sucesso"
else
    echo "❌ FALHA! Porta 3002 ainda inacessível"
    echo "📞 Executar: pm2 logs whatsapp-server --lines 20 -f"
fi

echo ""
echo "🔍 Para monitoramento contínuo:"
echo "   pm2 logs whatsapp-server --lines 0 -f" 