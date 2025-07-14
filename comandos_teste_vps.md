# COMANDOS PARA TESTAR QR CODE TIMING NA VPS

## 1. TESTE BÁSICO - Criar instância e verificar QR imediatamente

```bash
# Gerar ID único
INSTANCE_ID="timing_$(date +%s)"
echo "Testando instância: $INSTANCE_ID"

# Criar instância e medir tempo
time curl -X POST http://localhost:3002/instance/create \
  -H "Content-Type: application/json" \
  -d "{\"instanceId\": \"$INSTANCE_ID\"}" \
  -w "\nStatus: %{http_code}\nTempo: %{time_total}s\n"
```

## 2. VERIFICAR QR IMEDIATAMENTE (sem delay)

```bash
# Buscar QR imediatamente após criação
curl -s http://localhost:3002/instance/$INSTANCE_ID/qr | head -c 100
echo -e "\n--- Verificando se tem QR ---"
curl -s http://localhost:3002/instance/$INSTANCE_ID/qr | grep -o "data:image/png;base64" && echo "✅ QR DISPONÍVEL!" || echo "❌ QR não disponível"
```

## 3. TESTE COM DELAYS - Verificar em intervalos

```bash
# Aguardar 2 segundos e testar
echo "Aguardando 2s..."
sleep 2
curl -s http://localhost:3002/instance/$INSTANCE_ID/qr | grep -o "data:image/png;base64" && echo "✅ QR disponível em 2s" || echo "❌ QR não disponível em 2s"

# Aguardar mais 3 segundos (total 5s)
echo "Aguardando mais 3s (total 5s)..."
sleep 3
curl -s http://localhost:3002/instance/$INSTANCE_ID/qr | grep -o "data:image/png;base64" && echo "✅ QR disponível em 5s" || echo "❌ QR não disponível em 5s"

# Aguardar mais 5 segundos (total 10s)
echo "Aguardando mais 5s (total 10s)..."
sleep 5
curl -s http://localhost:3002/instance/$INSTANCE_ID/qr | grep -o "data:image/png;base64" && echo "✅ QR disponível em 10s" || echo "❌ QR não disponível em 10s"
```

## 4. VERIFICAR STATUS DA INSTÂNCIA

```bash
# Ver status da instância
curl -s http://localhost:3002/instance/$INSTANCE_ID/status | jq '.' 2>/dev/null || curl -s http://localhost:3002/instance/$INSTANCE_ID/status

# Listar todas as instâncias
curl -s http://localhost:3002/instances | jq '.' 2>/dev/null || curl -s http://localhost:3002/instances
```

## 5. TESTE COMPLETO EM UMA LINHA

```bash
# Teste completo - criar e verificar QR em intervalos
INSTANCE_ID="complete_test_$(date +%s)" && \
echo "=== CRIANDO INSTÂNCIA $INSTANCE_ID ===" && \
time curl -X POST http://localhost:3002/instance/create -H "Content-Type: application/json" -d "{\"instanceId\": \"$INSTANCE_ID\"}" && \
echo -e "\n=== VERIFICANDO QR IMEDIATAMENTE ===" && \
curl -s http://localhost:3002/instance/$INSTANCE_ID/qr | grep -o "data:image/png;base64" && echo "✅ QR IMEDIATO!" || echo "❌ QR não imediato" && \
echo "=== AGUARDANDO 3s ===" && sleep 3 && \
curl -s http://localhost:3002/instance/$INSTANCE_ID/qr | grep -o "data:image/png;base64" && echo "✅ QR em 3s!" || echo "❌ QR não em 3s" && \
echo "=== AGUARDANDO MAIS 5s (total 8s) ===" && sleep 5 && \
curl -s http://localhost:3002/instance/$INSTANCE_ID/qr | grep -o "data:image/png;base64" && echo "✅ QR em 8s!" || echo "❌ QR não em 8s"
```

## 6. VERIFICAR LOGS DO SERVIDOR (para debug)

```bash
# Ver logs do PM2
pm2 logs whatsapp-server --lines 20

# Ver logs em tempo real (CTRL+C para parar)
pm2 logs whatsapp-server --follow
```

## 7. VERIFICAR WEBHOOKS (se configurado)

```bash
# Verificar se há logs de webhook sendo enviado
pm2 logs whatsapp-server | grep -i webhook

# Verificar logs de QR
pm2 logs whatsapp-server | grep -i qr
```

## 8. LIMPAR INSTÂNCIAS DE TESTE

```bash
# Deletar instância de teste
curl -X DELETE http://localhost:3002/instance/$INSTANCE_ID

# Ou deletar todas as instâncias de teste
curl -s http://localhost:3002/instances | grep -o '"timing_[^"]*"' | while read id; do
  id=$(echo $id | tr -d '"')
  echo "Deletando $id"
  curl -X DELETE http://localhost:3002/instance/$id
done
```

---

## EXECUTE PRIMEIRO:
1. Execute o comando do item **5** (teste completo) para ver o comportamento geral
2. Se QR não vier imediatamente, execute os comandos do item **6** para ver os logs
3. Me informe os resultados! 