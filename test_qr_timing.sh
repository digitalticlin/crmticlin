#!/bin/bash

echo "=== TESTE DE TIMING QR CODE ==="
echo "Testando se QR code retorna imediatamente na criação..."
echo

# Gerar ID único para teste
INSTANCE_ID="timing_test_$(date +%s)"
echo "ID da instância: $INSTANCE_ID"
echo

# Testar criação com medição de tempo
echo "1. Criando instância e medindo tempo..."
START_TIME=$(date +%s.%N)

RESPONSE=$(curl -s -X POST http://31.97.24.222:3002/instance/create \
  -H "Content-Type: application/json" \
  -d "{\"instanceId\": \"$INSTANCE_ID\"}" \
  -w "\nHTTP_CODE:%{http_code}\nTIME_TOTAL:%{time_total}")

END_TIME=$(date +%s.%N)
CREATION_TIME=$(echo "$END_TIME - $START_TIME" | bc)

echo "Resposta da criação:"
echo "$RESPONSE"
echo
echo "Tempo de criação: ${CREATION_TIME}s"
echo

# Extrair código HTTP
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
echo "Status HTTP: $HTTP_CODE"
echo

# Aguardar 2 segundos e testar QR
echo "2. Aguardando 2s e testando QR..."
sleep 2

QR_START_TIME=$(date +%s.%N)
QR_RESPONSE=$(curl -s http://31.97.24.222:3002/instance/$INSTANCE_ID/qr -w "\nHTTP_CODE:%{http_code}\nTIME_TOTAL:%{time_total}")
QR_END_TIME=$(date +%s.%N)
QR_TIME=$(echo "$QR_END_TIME - $QR_START_TIME" | bc)

echo "Tempo para obter QR: ${QR_TIME}s"

# Verificar se QR está disponível
if echo "$QR_RESPONSE" | grep -q "data:image/png;base64"; then
    echo "✅ QR CODE DISPONÍVEL!"
    QR_LENGTH=$(echo "$QR_RESPONSE" | grep "data:image/png;base64" | wc -c)
    echo "Tamanho do QR: $QR_LENGTH caracteres"
else
    echo "❌ QR code não disponível ainda"
    echo "Resposta: $(echo "$QR_RESPONSE" | head -c 200)..."
fi

echo
echo "=== TESTE DE CRIAÇÃO COM QR IMEDIATO ==="
echo "Testando se podemos obter QR imediatamente após criação..."

# Novo teste - criar e buscar QR imediatamente
INSTANCE_ID2="immediate_test_$(date +%s)"
echo "Nova instância: $INSTANCE_ID2"

# Criar instância
echo "Criando instância..."
CREATE_RESPONSE=$(curl -s -X POST http://31.97.24.222:3002/instance/create \
  -H "Content-Type: application/json" \
  -d "{\"instanceId\": \"$INSTANCE_ID2\"}")

echo "Resposta: $CREATE_RESPONSE"

# Buscar QR imediatamente (sem delay)
echo "Buscando QR imediatamente..."
IMMEDIATE_QR=$(curl -s http://31.97.24.222:3002/instance/$INSTANCE_ID2/qr)

if echo "$IMMEDIATE_QR" | grep -q "data:image/png;base64"; then
    echo "✅ QR DISPONÍVEL IMEDIATAMENTE!"
else
    echo "⏳ QR não disponível imediatamente"
    echo "Aguardando 3s e tentando novamente..."
    sleep 3
    DELAYED_QR=$(curl -s http://31.97.24.222:3002/instance/$INSTANCE_ID2/qr)
    
    if echo "$DELAYED_QR" | grep -q "data:image/png;base64"; then
        echo "✅ QR disponível após 3s"
    else
        echo "❌ QR ainda não disponível"
        echo "Resposta: $(echo "$DELAYED_QR" | head -c 200)..."
    fi
fi

echo
echo "=== VERIFICAÇÃO DE WEBHOOKS ==="
echo "Verificando se webhooks estão sendo enviados..."

# Aguardar um pouco para possíveis webhooks
echo "Aguardando 10s para verificar logs de webhook..."
sleep 10

echo "Teste concluído!"
echo "Instâncias criadas: $INSTANCE_ID, $INSTANCE_ID2"
echo "Use 'curl http://31.97.24.222:3002/instances' para ver todas as instâncias" 