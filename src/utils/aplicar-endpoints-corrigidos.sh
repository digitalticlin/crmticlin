
#!/bin/bash

# APLICAR CORREÇÕES DE ENDPOINTS V4.0
echo "🔧 APLICANDO CORREÇÕES DE ENDPOINTS V4.0"
echo "======================================="

echo "📅 Data: $(date)"
echo "🎯 Objetivo: Corrigir endpoints ausentes e timeout"
echo ""

echo "🛑 FASE 1: PARAR SERVIDOR ATUAL"
echo "=============================="

echo "📋 Parando processo PM2..."
pm2 stop whatsapp-main-3002 2>/dev/null || echo "⚠️ Processo não estava rodando"
pm2 delete whatsapp-main-3002 2>/dev/null || echo "⚠️ Processo não existia"

echo "📋 Verificando porta 3002..."
lsof -i :3002 | grep LISTEN && echo "⚠️ Processo ainda na porta 3002" || echo "✅ Porta 3002 liberada"

echo ""
echo "💾 FASE 2: BACKUP E APLICAÇÃO"
echo "==========================="

echo "📋 Fazendo backup do arquivo atual..."
if [ -f "vps-server-persistent.js" ]; then
    cp vps-server-persistent.js "vps-server-backup-$(date +%Y%m%d_%H%M%S).js"
    echo "✅ Backup criado"
else
    echo "⚠️ Arquivo atual não encontrado"
fi

echo ""
echo "📝 IMPORTANTE: APLICAR MANUALMENTE O ARQUIVO CORRIGIDO"
echo "=================================================="
echo ""
echo "1. Copie o conteúdo do arquivo:"
echo "   src/utils/vps-server-v4-endpoints-fixed.js"
echo ""
echo "2. Substitua todo o conteúdo do arquivo:"
echo "   nano vps-server-persistent.js"
echo "   (Cole o novo conteúdo e salve)"
echo ""
echo "3. Execute os comandos finais:"
echo "   pm2 start vps-server-persistent.js --name whatsapp-main-3002"
echo "   pm2 logs whatsapp-main-3002 --lines 15"
echo "   pm2 save"
echo ""

echo "✅ CORREÇÕES IMPLEMENTADAS:"
echo "========================="
echo "   🔧 Endpoint /instances adicionado (estava 404)"
echo "   ⚡ Criação de instância com resposta rápida"
echo "   🚀 Inicialização em background (sem timeout)"
echo "   📊 Endpoint /test-send para testes"
echo "   💬 Endpoint /chat-history para histórico"
echo "   📱 Status melhorado com contagem de mensagens"
echo "   🔄 Error handling aprimorado"

echo ""
echo "📋 APÓS APLICAR, TESTE COM:"
echo "   ./teste-jornada-cliente.sh"

echo ""
echo "🎯 VERSÃO: 4.0.0-ENDPOINTS-FIXED"
echo "================================"
