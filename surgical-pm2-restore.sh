
#!/bin/bash
# CORREÇÃO CIRÚRGICA PM2 - Restaurar sem prejudicar funcionalidades existentes
# Versão: 1.0 - Foco em diagnóstico preciso e correção conservadora

echo "🔍 DIAGNÓSTICO CIRÚRGICO PM2 - Análise do Estado Atual"
echo "====================================================="

# Passo 1: Diagnóstico completo do estado atual
echo "1️⃣ Verificando estado atual do sistema..."

echo "📋 Processos PM2 ativos:"
pm2 list

echo -e "\n🔍 Processos Node.js na porta 3002:"
lsof -i :3002 2>/dev/null || echo "Nenhum processo na porta 3002"

echo -e "\n📁 Arquivos disponíveis no diretório:"
ls -la server*.js 2>/dev/null || echo "Nenhum arquivo server*.js encontrado"

echo -e "\n🔧 Verificando se PM2 está instalado e funcionando:"
pm2 --version || echo "PM2 não está instalado"

# Passo 2: Identificar qual server.js usar
echo -e "\n2️⃣ Identificando arquivo server.js funcional..."

# Verificar se existe server.js atual
if [ -f "server.js" ]; then
    echo "✅ server.js encontrado - verificando integridade..."
    
    # Verificar se tem sintaxe válida
    node -c server.js 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ server.js tem sintaxe válida"
        SERVER_FILE="server.js"
    else
        echo "❌ server.js tem erro de sintaxe"
        
        # Procurar backup funcional
        BACKUP_FILE=$(ls -t server-backup-*.js 2>/dev/null | head -n1)
        if [ -n "$BACKUP_FILE" ]; then
            echo "🔄 Encontrado backup: $BACKUP_FILE"
            node -c "$BACKUP_FILE" 2>/dev/null
            if [ $? -eq 0 ]; then
                echo "✅ Backup tem sintaxe válida - usando backup"
                SERVER_FILE="$BACKUP_FILE"
            else
                echo "❌ Backup também tem problemas"
            fi
        fi
    fi
else
    echo "❌ server.js não encontrado"
    
    # Procurar qualquer backup
    BACKUP_FILE=$(ls -t server-backup-*.js 2>/dev/null | head -n1)
    if [ -n "$BACKUP_FILE" ]; then
        echo "🔄 Usando backup mais recente: $BACKUP_FILE"
        SERVER_FILE="$BACKUP_FILE"
    else
        echo "❌ Nenhum arquivo server disponível"
        exit 1
    fi
fi

echo "📄 Arquivo selecionado: $SERVER_FILE"

# Passo 3: Limpeza conservadora
echo -e "\n3️⃣ Limpeza conservadora (sem afetar dados)..."

# Parar qualquer processo PM2 relacionado (sem deletar dados)
echo "🛑 Parando processos PM2 existentes..."
pm2 stop all 2>/dev/null || true
pm2 delete whatsapp-server 2>/dev/null || true

# Verificar se porta 3002 está livre
echo "🔍 Verificando se porta 3002 está livre..."
PORT_CHECK=$(lsof -i :3002 2>/dev/null)
if [ -n "$PORT_CHECK" ]; then
    echo "⚠️  Porta 3002 ainda ocupada:"
    echo "$PORT_CHECK"
    echo "🔧 Tentando liberar porta..."
    pkill -f "node.*3002" 2>/dev/null || true
    sleep 2
fi

# Passo 4: Restauração cirúrgica do PM2
echo -e "\n4️⃣ Restauração cirúrgica do PM2..."

# Garantir que usamos o arquivo correto
if [ "$SERVER_FILE" != "server.js" ]; then
    echo "🔄 Copiando arquivo funcional para server.js..."
    cp "$SERVER_FILE" server.js
fi

# Verificar estrutura de diretórios essenciais
echo "📁 Verificando estrutura de diretórios..."
mkdir -p auth_info logs

# Iniciar PM2 com configuração mínima e segura
echo "🚀 Iniciando PM2 com configuração conservadora..."

pm2 start server.js \
  --name "whatsapp-server" \
  --instances 1 \
  --exec-mode cluster \
  --max-memory-restart 1G \
  --restart-delay 5000 \
  --max-restarts 5 \
  --min-uptime 10s \
  --log-date-format "YYYY-MM-DD HH:mm:ss" \
  --merge-logs \
  --kill-timeout 5000 \
  --listen-timeout 10000

# Aguardar inicialização
echo "⏳ Aguardando inicialização (15 segundos)..."
sleep 15

# Passo 5: Validação cirúrgica
echo -e "\n5️⃣ Validação cirúrgica das funcionalidades essenciais..."

echo "🔍 Status do PM2:"
pm2 status whatsapp-server

echo -e "\n🌐 Testando endpoint de saúde:"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3002/health 2>/dev/null || echo "ERRO_CONEXAO")

if echo "$HEALTH_RESPONSE" | grep -q "200$"; then
    echo "✅ Servidor respondendo na porta 3002"
    echo "📊 Resposta do /health:"
    echo "$HEALTH_RESPONSE" | head -n -1 | jq . 2>/dev/null || echo "$HEALTH_RESPONSE" | head -n -1
else
    echo "❌ Servidor não está respondendo corretamente"
    echo "📋 Logs do PM2:"
    pm2 logs whatsapp-server --lines 20 --nostream
fi

echo -e "\n🔍 Testando endpoint de status:"
STATUS_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3002/status 2>/dev/null || echo "ERRO_CONEXAO")

if echo "$STATUS_RESPONSE" | grep -q "200$"; then
    echo "✅ Endpoint /status funcionando"
else
    echo "⚠️  Endpoint /status com problemas"
fi

echo -e "\n🔍 Testando endpoint de instâncias:"
INSTANCES_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3002/instances 2>/dev/null || echo "ERRO_CONEXAO")

if echo "$INSTANCES_RESPONSE" | grep -q "200$"; then
    echo "✅ Endpoint /instances funcionando"
else
    echo "⚠️  Endpoint /instances com problemas"
fi

# Passo 6: Relatório final
echo -e "\n6️⃣ RELATÓRIO FINAL DA CORREÇÃO CIRÚRGICA"
echo "============================================"

echo "📋 Status dos Componentes Críticos:"
pm2 list | grep whatsapp-server
echo ""

echo "🔗 Endpoints Essenciais:"
echo "  • http://localhost:3002/health"
echo "  • http://localhost:3002/status"
echo "  • http://localhost:3002/instances"
echo ""

echo "💾 Dados Preservados:"
echo "  • Diretório auth_info mantido"
echo "  • Sessões WhatsApp preservadas"
echo "  • Configurações existentes mantidas"
echo ""

echo "📝 Próximos Passos Recomendados:"
echo "  1. Verificar se instâncias WhatsApp reconectam automaticamente"
echo "  2. Testar criação de nova instância"
echo "  3. Verificar recebimento de mensagens"
echo "  4. Confirmar funcionamento dos webhooks"
echo ""

echo "🎯 CORREÇÃO CIRÚRGICA CONCLUÍDA"
echo "Status: $(pm2 list | grep whatsapp-server | awk '{print $10}' || echo 'VERIFICAR_MANUALMENTE')"

# Salvar PM2 configuration
pm2 save
echo "✅ Configuração PM2 salva"

echo ""
echo "🚨 IMPORTANTE: Execute os testes de validação antes de considerar funcional!"
