
#!/bin/bash

# DEPLOY WHATSAPP SERVER PARA PORTA 3002
# Migra o servidor completo para a porta 3002 na VPS
echo "🚀 DEPLOY WHATSAPP SERVER PARA PORTA 3002"
echo "=========================================="
echo "📅 $(date)"
echo "🎯 Migrar servidor completo para porta 3002"
echo ""

# Configurações da VPS
VPS_IP="31.97.24.222"
VPS_USER="root"
TARGET_PORT="3002"
AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"

# Função de log
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

log "🔧 INICIANDO DEPLOY DO SERVIDOR WHATSAPP"

# ETAPA 1: VERIFICAR ARQUIVO LOCAL
if [ ! -f "src/utils/whatsapp-server.js" ]; then
    log "❌ ERRO: Arquivo src/utils/whatsapp-server.js não encontrado!"
    echo "Execute este script a partir da raiz do projeto."
    exit 1
fi

log "✅ Arquivo whatsapp-server.js encontrado localmente"

# ETAPA 2: PARAR SERVIÇOS ANTIGOS NA VPS
log "⏹️ Parando serviços WhatsApp antigos na VPS..."

ssh ${VPS_USER}@${VPS_IP} << 'REMOTE_STOP'
# Parar todos os processos WhatsApp
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Matar processos órfãos nas portas 3001 e 3002
pkill -f "node.*300[12]" 2>/dev/null || true
pkill -f "whatsapp" 2>/dev/null || true

# Limpar porta 3002 especificamente
lsof -ti :3002 | xargs kill -9 2>/dev/null || true

echo "✅ Serviços antigos parados e porta 3002 liberada"
REMOTE_STOP

# ETAPA 3: ENVIAR ARQUIVO PARA VPS
log "📤 Enviando whatsapp-server.js para VPS..."

scp src/utils/whatsapp-server.js ${VPS_USER}@${VPS_IP}:/root/whatsapp-server.js

if [ $? -eq 0 ]; then
    log "✅ Arquivo enviado com sucesso para /root/whatsapp-server.js"
else
    log "❌ ERRO: Falha no envio do arquivo"
    exit 1
fi

# ETAPA 4: CONFIGURAR E INICIAR SERVIDOR NA VPS
log "⚙️ Configurando servidor na porta 3002..."

ssh ${VPS_USER}@${VPS_IP} << REMOTE_SETUP
# Ir para diretório root
cd /root

# Verificar se arquivo foi recebido
if [ ! -f "whatsapp-server.js" ]; then
    echo "❌ ERRO: Arquivo whatsapp-server.js não foi recebido!"
    exit 1
fi

echo "✅ Arquivo whatsapp-server.js confirmado na VPS"

# Instalar dependências se necessário
echo "📦 Verificando dependências Node.js..."
npm list whatsapp-web.js express cors 2>/dev/null || npm install whatsapp-web.js express cors

# Configurar variáveis de ambiente
echo "🌍 Configurando variáveis de ambiente..."
export WHATSAPP_PORT=3002
export VPS_API_TOKEN=3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3
export NODE_ENV=production
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Adicionar ao bashrc para persistência
echo "export WHATSAPP_PORT=3002" >> /root/.bashrc
echo "export VPS_API_TOKEN=3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" >> /root/.bashrc
echo "export NODE_ENV=production" >> /root/.bashrc
echo "export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> /root/.bashrc

# Criar diretórios necessários
mkdir -p /root/whatsapp_sessions
mkdir -p /root/.wwebjs_auth
chmod 755 /root/whatsapp_sessions
chmod 755 /root/.wwebjs_auth

# Verificar Chrome
if command -v google-chrome-stable &> /dev/null; then
    echo "✅ Google Chrome disponível"
    export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
    echo "export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable" >> /root/.bashrc
elif command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium disponível"
    export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
    echo "export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser" >> /root/.bashrc
else
    echo "⚠️ Chrome não encontrado, mas continuando..."
fi

# Iniciar servidor com PM2
echo "🚀 Iniciando servidor WhatsApp na porta 3002..."
pm2 start whatsapp-server.js --name whatsapp-main-3002 --env production

# Salvar configuração PM2
pm2 save

# Aguardar inicialização
sleep 5

# Verificar status
echo "📊 Status do servidor:"
pm2 status whatsapp-main-3002

echo "✅ DEPLOY CONCLUÍDO NA VPS!"
REMOTE_SETUP

# ETAPA 5: TESTAR CONECTIVIDADE
log "🧪 TESTANDO CONECTIVIDADE..."

sleep 3

echo ""
echo "📋 TESTE 1: Health Check"
health_response=$(curl -s -w "HTTP_STATUS:%{http_code}" "http://${VPS_IP}:${TARGET_PORT}/health" --max-time 10 2>/dev/null)
http_status=$(echo $health_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo $health_response | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status HTTP: $http_status"
echo "Response: $response_body"

if [ "$http_status" = "200" ]; then
    log "✅ HEALTH CHECK: SUCESSO!"
    
    # Testar criação de instância
    echo ""
    echo "📋 TESTE 2: Criação de Instância"
    
    create_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST \
        "http://${VPS_IP}:${TARGET_PORT}/instance/create" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"instanceName":"test_deploy"}' \
        --max-time 30 2>/dev/null)
    
    create_status=$(echo $create_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    create_body=$(echo $create_response | sed 's/HTTP_STATUS:[0-9]*$//')
    
    echo "Status HTTP: $create_status"
    echo "Response: $create_body"
    
    if [ "$create_status" = "200" ]; then
        log "✅ CRIAÇÃO DE INSTÂNCIA: SUCESSO!"
        
        # Extrair instanceId para limpeza
        instance_id=$(echo "$create_body" | grep -o '"instanceId":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$instance_id" ]; then
            echo ""
            echo "🧹 Limpando instância de teste..."
            curl -s -X DELETE \
                "http://${VPS_IP}:${TARGET_PORT}/instance/${instance_id}" \
                -H "Authorization: Bearer ${AUTH_TOKEN}" \
                --max-time 10 > /dev/null 2>&1
            log "✅ Instância de teste removida"
        fi
    else
        log "❌ CRIAÇÃO DE INSTÂNCIA: FALHA"
    fi
else
    log "❌ HEALTH CHECK: FALHA"
fi

echo ""
echo "🎉 RESUMO DO DEPLOY:"
echo "==================="

if [ "$http_status" = "200" ]; then
    echo "   ✅ Servidor enviado para VPS: /root/whatsapp-server.js"
    echo "   ✅ Configurado na porta: ${TARGET_PORT}"
    echo "   ✅ PM2 configurado: whatsapp-main-3002"
    echo "   ✅ Health Check: FUNCIONANDO"
    echo "   ✅ URL do servidor: http://${VPS_IP}:${TARGET_PORT}"
    echo ""
    echo "🚀 PRÓXIMOS PASSOS:"
    echo "   1. Teste na interface web: criar nova instância"
    echo "   2. Verificar geração de QR Code"
    echo "   3. Testar envio de mensagens"
    echo ""
    echo "📋 COMANDOS ÚTEIS:"
    echo "   pm2 logs whatsapp-main-3002"
    echo "   pm2 restart whatsapp-main-3002"
    echo "   curl http://${VPS_IP}:${TARGET_PORT}/health"
else
    echo "   ❌ Deploy com problemas"
    echo "   📋 Verificar logs: ssh root@${VPS_IP} 'pm2 logs whatsapp-main-3002'"
    echo "   🔧 Restart manual: ssh root@${VPS_IP} 'pm2 restart whatsapp-main-3002'"
fi

log "✅ DEPLOY SCRIPT FINALIZADO!"
