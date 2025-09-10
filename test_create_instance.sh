#!/bin/bash

echo "=== Testando criação da instância contatoluizantoniooliveira ==="

# Criar arquivo JSON
cat > /tmp/create_instance.json << 'EOF'
{
  "instanceId": "contatoluizantoniooliveira"
}
EOF

echo "JSON criado:"
cat /tmp/create_instance.json

echo ""
echo "=== Enviando requisição ==="
curl -X POST http://localhost:3002/instance/create \
  -H "Content-Type: application/json" \
  -d @/tmp/create_instance.json

echo ""
echo ""
echo "=== Verificando instâncias ==="
curl -X GET http://localhost:3002/instances

echo ""
echo ""
echo "=== Limpando arquivo temporário ==="
rm -f /tmp/create_instance.json

echo "Teste concluído!" 