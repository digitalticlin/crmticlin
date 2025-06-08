
#!/bin/bash
# Comandos SSH para Investigação Completa da VPS
# Execute: ssh root@31.97.24.222 < vps-investigation-commands.sh

echo "=== 🔍 INVESTIGAÇÃO PROFUNDA DA VPS INICIADA ==="
echo "Data/Hora: $(date)"
echo "==========================="

# 1. DESCOBRIR ARQUIVOS DO SERVIDOR
echo "=== 📂 DESCOBRINDO ARQUIVOS DO SERVIDOR ==="
echo "🔍 Procurando arquivos JavaScript/Node.js:"
find /root -name "*.js" -type f | head -10

echo "🔍 Procurando arquivos do WhatsApp:"
find /root -name "*whatsapp*" -type f | head -10

echo "🔍 Verificando diretório atual:"
pwd
ls -la

echo "🔍 Verificando processos PM2:"
pm2 list

echo "🔍 Verificando processo ativo na porta 3001:"
netstat -tulpn | grep 3001

# 2. EXAMINAR CÓDIGO REAL DO SERVIDOR
echo "=== 📋 EXAMINANDO CÓDIGO REAL DO SERVIDOR ==="
echo "🔍 Tentando localizar arquivo principal..."

# Tentar diferentes possibilidades de arquivo
for file in "/root/whatsapp-server.js" "/root/server.js" "/root/app.js" "/root/index.js"; do
  if [ -f "$file" ]; then
    echo "✅ Arquivo encontrado: $file"
    echo "--- ROTAS ENCONTRADAS ---"
    grep -n "app\.\(get\|post\|delete\|put\)" "$file" | head -20
    echo "--- ENDPOINTS ESPECÍFICOS ---"
    grep -i -A 3 -B 3 "qr\|delete\|send" "$file" | head -30
    break
  else
    echo "❌ Arquivo não encontrado: $file"
  fi
done

# 3. VERIFICAR LOGS DO PM2
echo "=== 📜 VERIFICANDO LOGS DO PM2 ==="
echo "🔍 Logs recentes do servidor:"
pm2 logs --lines 20

# 4. TESTAR TODOS OS ENDPOINTS POSSÍVEIS COM DETALHES
echo "=== 🧪 TESTANDO ENDPOINTS COM DETALHES ==="

echo "🧪 Teste 1: Health Check"
curl -v -X GET http://localhost:3001/health 2>&1 | head -15

echo "🧪 Teste 2: Instances"
curl -v -X GET http://localhost:3001/instances 2>&1 | head -15

echo "🧪 Teste 3: Create Instance"
curl -v -X POST http://localhost:3001/instance/create \
  -H "Content-Type: application/json" \
  -d '{"instanceId": "investigation_test", "sessionName": "test"}' 2>&1 | head -15

# Testar todas as possibilidades de QR Code
echo "🧪 Teste 4a: QR GET /qr/{id}"
curl -v -X GET http://localhost:3001/qr/investigation_test 2>&1 | head -10

echo "🧪 Teste 4b: QR GET /instance/{id}/qr"
curl -v -X GET http://localhost:3001/instance/investigation_test/qr 2>&1 | head -10

echo "🧪 Teste 4c: QR POST /instance/qr"
curl -v -X POST http://localhost:3001/instance/qr \
  -H "Content-Type: application/json" \
  -d '{"instanceId": "investigation_test"}' 2>&1 | head -10

echo "🧪 Teste 4d: QR POST /qr"
curl -v -X POST http://localhost:3001/qr \
  -H "Content-Type: application/json" \
  -d '{"instanceId": "investigation_test"}' 2>&1 | head -10

# Testar possibilidades de envio
echo "🧪 Teste 5a: Send POST /send"
curl -v -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{"instanceId": "investigation_test", "to": "test", "message": "test"}' 2>&1 | head -10

echo "🧪 Teste 5b: Send POST /message"
curl -v -X POST http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -d '{"instanceId": "investigation_test", "to": "test", "message": "test"}' 2>&1 | head -10

echo "🧪 Teste 5c: Send POST /instance/{id}/send"
curl -v -X POST http://localhost:3001/instance/investigation_test/send \
  -H "Content-Type: application/json" \
  -d '{"to": "test", "message": "test"}' 2>&1 | head -10

# Testar possibilidades de delete
echo "🧪 Teste 6a: Delete POST /instance/delete"
curl -v -X POST http://localhost:3001/instance/delete \
  -H "Content-Type: application/json" \
  -d '{"instanceId": "investigation_test"}' 2>&1 | head -10

echo "🧪 Teste 6b: Delete DELETE /instance/{id}"
curl -v -X DELETE http://localhost:3001/instance/investigation_test 2>&1 | head -10

echo "🧪 Teste 6c: Delete POST /delete"
curl -v -X POST http://localhost:3001/delete \
  -H "Content-Type: application/json" \
  -d '{"instanceId": "investigation_test"}' 2>&1 | head -10

# 5. CONTAGEM ATUAL DE INSTÂNCIAS
echo "=== 📊 CONTAGEM DE INSTÂNCIAS ==="
echo "🔍 Quantidade de instâncias ativas:"
curl -s http://localhost:3001/instances | jq '.instances | length' 2>/dev/null || echo "Erro ao contar com jq"

echo "🔍 Lista de IDs das instâncias:"
curl -s http://localhost:3001/instances | jq '.instances[].instanceId' 2>/dev/null || echo "Erro ao listar IDs"

# 6. INFORMAÇÕES DO SISTEMA
echo "=== 💻 INFORMAÇÕES DO SISTEMA ==="
echo "🔍 Versão do Node.js:"
node --version

echo "🔍 Versão do PM2:"
pm2 --version

echo "🔍 Uso de memória:"
free -m

echo "🔍 Espaço em disco:"
df -h

echo "=== ✅ INVESTIGAÇÃO COMPLETA FINALIZADA ==="
echo "Data/Hora: $(date)"
