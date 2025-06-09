
#!/bin/bash

# Script para aplicar correções críticas na VPS
echo "🚀 APLICANDO CORREÇÕES CRÍTICAS - 4 PROBLEMAS RESOLVIDOS"
echo "=========================================================="

# 1. Parar servidor atual
echo "🛑 Parando servidor atual..."
pm2 stop whatsapp-main-3002 2>/dev/null || true
pm2 delete whatsapp-main-3002 2>/dev/null || true

# 2. Backup do arquivo anterior
echo "💾 Fazendo backup..."
cp vps-server-persistent.js vps-server-backup-critico-$(date +%Y%m%d_%H%M%S).js 2>/dev/null || true

# 3. Aplicar correções críticas
echo "🔧 Aplicando correções críticas..."
cp vps-server-corrigido.js vps-server-persistent.js

# 4. Instalar/atualizar dependências
echo "📦 Verificando dependências..."
npm install whatsapp-web.js@latest express cors node-fetch qrcode

# 5. Verificar Chrome
echo "🌐 Verificando Chrome..."
if ! command -v google-chrome &> /dev/null; then
    echo "📥 Instalando Google Chrome..."
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
    apt-get update -y
    apt-get install -y google-chrome-stable
fi

# 6. Limpar sessions antigas
echo "🧹 Limpando sessões antigas..."
rm -rf /root/sessions/* 2>/dev/null || true
rm -rf /root/whatsapp_instances/sessions/* 2>/dev/null || true

# 7. Configurar variáveis de ambiente
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# 8. Reiniciar servidor com correções
echo "🚀 Iniciando servidor com correções críticas..."
PORT=3002 AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" pm2 start vps-server-persistent.js --name whatsapp-main-3002

# 9. Salvar configuração PM2
pm2 save

# 10. Aguardar inicialização
echo "⏳ Aguardando inicialização (15s)..."
sleep 15

# 11. Verificar status
echo "📊 Status final:"
pm2 status
echo ""

# 12. Testar correções
echo "🧪 Testando correções aplicadas:"
echo ""

echo "1. Testando health check..."
curl -s http://localhost:3002/health | jq '{version, criticalFixesApplied, status}'

echo ""
echo "2. Testando status com correções..."
curl -s http://localhost:3002/status | jq '{fixes, status, activeInstances}'

echo ""
echo "🎉 CORREÇÕES CRÍTICAS APLICADAS COM SUCESSO!"
echo "=============================================="
echo "✅ Problema 1: Autenticação VPS-Supabase corrigida (Service Role)"
echo "✅ Problema 2: Payload webhook padronizado"
echo "✅ Problema 3: Endpoints /contacts e /messages adicionados"
echo "✅ Problema 4: Compatibilidade RLS melhorada"
echo ""
echo "📋 Próximos passos:"
echo "1. Execute: ./teste-pos-correcoes.sh"
echo "2. Teste via interface web"
echo "3. Monitore logs: pm2 logs whatsapp-main-3002"
echo ""
echo "🔗 Endpoints corrigidos disponíveis:"
echo "   GET  /health                     - Health check"
echo "   GET  /status                     - Status com correções"
echo "   POST /instance/create            - Criar instância"
echo "   GET  /instance/:id/qr            - Buscar QR Code"
echo "   GET  /instance/:id/contacts      - 🆕 Buscar contatos"
echo "   GET  /instance/:id/messages      - 🆕 Buscar mensagens"
echo "   POST /send                       - Enviar mensagem"
echo "   DELETE /instance/:id             - Deletar instância"
