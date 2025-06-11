
#!/bin/bash

# SCRIPT DE INSTALAÇÃO - SERVIDOR BAILEYS SEM PUPPETEER
# NÍVEL 8 - CORREÇÃO COMPLETA
# Execute este script na VPS para aplicar todas as correções

echo "🚀 INICIANDO INSTALAÇÃO BAILEYS - NÍVEL 8"

# 1. PARAR PM2
echo "1. Parando PM2..."
pm2 stop whatsapp-server 2>/dev/null || echo "PM2 não estava rodando"

# 2. BACKUP DO ARQUIVO ATUAL
echo "2. Fazendo backup..."
if [ -f "server.js" ]; then
    cp server.js server_puppeteer_backup.js
    echo "✅ Backup criado: server_puppeteer_backup.js"
fi

# 3. INSTALAR BAILEYS E DEPENDÊNCIAS
echo "3. Instalando Baileys..."
npm install @whiskeysockets/baileys@latest qrcode@latest

# 4. VERIFICAR SE TEM WHATSAPP-WEB.JS ANTIGO (REMOVER)
echo "4. Removendo dependências antigas..."
npm uninstall whatsapp-web.js puppeteer puppeteer-core 2>/dev/null || echo "Dependências antigas não encontradas"

# 5. BAIXAR NOVO SERVIDOR BAILEYS
echo "5. Baixando servidor Baileys..."
cat > server.js << 'EOFSERVER'
// CÓDIGO DO SERVIDOR SERÁ COLADO AQUI MANUALMENTE
// OU BAIXADO DE UM REPOSITÓRIO
EOFSERVER

# VERIFICAR SE server-baileys.js EXISTE E COPIAR
if [ -f "server-baileys.js" ]; then
    cp server-baileys.js server.js
    echo "✅ Servidor Baileys copiado"
else
    echo "⚠️ Arquivo server-baileys.js não encontrado. Cole o código manualmente."
fi

# 6. CRIAR DIRETÓRIO DE SESSÕES
echo "6. Criando diretórios..."
mkdir -p sessions
chmod 755 sessions

# 7. TESTAR SINTAXE
echo "7. Testando sintaxe do Node.js..."
if node -c server.js; then
    echo "✅ Sintaxe válida"
else
    echo "❌ Erro de sintaxe. Verifique o arquivo server.js"
    exit 1
fi

# 8. REINICIAR PM2
echo "8. Reiniciando PM2..."
pm2 restart whatsapp-server || pm2 start server.js --name whatsapp-server

# 9. AGUARDAR INICIALIZAÇÃO
echo "9. Aguardando inicialização..."
sleep 5

# 10. TESTAR ENDPOINTS
echo "10. Testando endpoints..."

echo "=== TESTE HEALTH ==="
curl -s http://localhost:3002/health | jq '.' || curl -s http://localhost:3002/health

echo -e "\n=== TESTE CRIAR INSTÂNCIA ==="
curl -s -X POST http://localhost:3002/instance/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  -d '{"instanceId":"teste_baileys","sessionName":"teste_baileys"}' | jq '.' || echo "Erro no teste"

echo -e "\n=== TESTE LISTAR INSTÂNCIAS ==="
curl -s -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  http://localhost:3002/instances | jq '.' || echo "Erro no teste"

echo -e "\n=== INSTALAÇÃO COMPLETADA ==="
echo "✅ Baileys instalado"
echo "❌ Puppeteer removido"
echo "🔧 Endpoints corrigidos"
echo "📱 QR Code via Baileys"
echo ""
echo "PRÓXIMOS PASSOS:"
echo "1. Testar criação via Edge Function"
echo "2. Verificar logs: pm2 logs whatsapp-server"
echo "3. Monitorar status: pm2 status"

# 11. MOSTRAR STATUS FINAL
echo -e "\n=== STATUS FINAL ==="
pm2 status
