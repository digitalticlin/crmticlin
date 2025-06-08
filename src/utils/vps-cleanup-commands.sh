
#!/bin/bash
# Comandos SSH para Limpeza Completa da VPS
# Execute: ssh root@31.97.24.222 < vps-cleanup-commands.sh

echo "=== 🧹 LIMPEZA COMPLETA DA VPS INICIADA ==="
echo "⚠️  CUIDADO: Isso irá deletar TODAS as instâncias!"
echo "Data/Hora: $(date)"
echo "==========================="

# 1. BACKUP DA SITUAÇÃO ATUAL
echo "=== 💾 BACKUP DA SITUAÇÃO ATUAL ==="
echo "🔍 Contagem antes da limpeza:"
BEFORE_COUNT=$(curl -s http://localhost:3001/instances | jq '.instances | length' 2>/dev/null || echo "0")
echo "Instâncias antes: $BEFORE_COUNT"

echo "🔍 Lista completa antes:"
curl -s http://localhost:3001/instances | jq '.instances[] | {instanceId, status}' 2>/dev/null || echo "Erro ao listar"

# 2. DESCOBRIR MÉTODO DE DELEÇÃO QUE FUNCIONA
echo "=== 🔬 DESCOBRINDO MÉTODO DE DELEÇÃO ==="

# Testar com uma instância de exemplo
TEST_INSTANCE=$(curl -s http://localhost:3001/instances | jq -r '.instances[0].instanceId' 2>/dev/null)

if [ "$TEST_INSTANCE" != "null" ] && [ -n "$TEST_INSTANCE" ]; then
  echo "🧪 Testando deleção com instância: $TEST_INSTANCE"
  
  echo "Método 1: POST /instance/delete"
  RESULT1=$(curl -s -X POST http://localhost:3001/instance/delete \
    -H "Content-Type: application/json" \
    -d "{\"instanceId\": \"$TEST_INSTANCE\"}")
  echo "Resultado 1: $RESULT1"
  
  # Se o primeiro método não funcionou, testar outros
  if [[ "$RESULT1" == *"404"* ]] || [[ "$RESULT1" == *"Cannot"* ]]; then
    echo "Método 2: DELETE /instance/{id}"
    RESULT2=$(curl -s -X DELETE "http://localhost:3001/instance/$TEST_INSTANCE")
    echo "Resultado 2: $RESULT2"
    
    echo "Método 3: POST /delete"
    RESULT3=$(curl -s -X POST http://localhost:3001/delete \
      -H "Content-Type: application/json" \
      -d "{\"instanceId\": \"$TEST_INSTANCE\"}")
    echo "Resultado 3: $RESULT3"
  fi
else
  echo "❌ Nenhuma instância encontrada para teste"
fi

# 3. LIMPEZA EM MASSA (após descobrir método correto)
echo "=== 🗑️ LIMPEZA EM MASSA ==="

# Obter todas as instâncias
ALL_INSTANCES=$(curl -s http://localhost:3001/instances | jq -r '.instances[].instanceId' 2>/dev/null)

if [ -n "$ALL_INSTANCES" ]; then
  echo "🔄 Deletando todas as instâncias encontradas..."
  
  for instance in $ALL_INSTANCES; do
    echo "🗑️ Deletando: $instance"
    
    # Tentar método POST primeiro (mais provável de funcionar)
    RESULT=$(curl -s -X POST http://localhost:3001/instance/delete \
      -H "Content-Type: application/json" \
      -d "{\"instanceId\": \"$instance\"}")
    
    echo "   Resultado: $(echo $RESULT | head -c 100)..."
    
    # Se POST falhar, tentar DELETE
    if [[ "$RESULT" == *"404"* ]] || [[ "$RESULT" == *"Cannot"* ]]; then
      echo "   Tentando DELETE..."
      RESULT2=$(curl -s -X DELETE "http://localhost:3001/instance/$instance")
      echo "   Resultado DELETE: $(echo $RESULT2 | head -c 100)..."
    fi
    
    sleep 0.5  # Pausa pequena entre requests
  done
else
  echo "❌ Nenhuma instância encontrada para deletar"
fi

# 4. LIMPEZA DE ARQUIVOS DO SISTEMA
echo "=== 🧽 LIMPEZA DE ARQUIVOS DO SISTEMA ==="

echo "🗑️ Limpando arquivos de sessão WhatsApp..."
rm -rf /root/.wwebjs_auth/session-* 2>/dev/null || echo "Nenhum arquivo .wwebjs_auth encontrado"
rm -rf /root/.wwebjs_cache/* 2>/dev/null || echo "Nenhum arquivo .wwebjs_cache encontrado"
rm -rf /root/sessions/* 2>/dev/null || echo "Nenhum arquivo sessions encontrado"

echo "🗑️ Limpando possíveis diretórios de instâncias..."
find /root -name "*instance*" -type d | head -5
rm -rf /root/whatsapp_instances/* 2>/dev/null || echo "Nenhum whatsapp_instances encontrado"

echo "📊 Verificando arquivos restantes:"
ls -la /root/.wwebjs_auth/ 2>/dev/null | wc -l || echo "0"
ls -la /root/.wwebjs_cache/ 2>/dev/null | wc -l || echo "0"

# 5. REINICIAR SERVIDOR
echo "=== 🔄 REINICIANDO SERVIDOR ==="
echo "🔄 Reiniciando PM2..."
pm2 restart all
sleep 3

echo "🔄 Verificando se servidor subiu..."
pm2 list

# 6. VERIFICAÇÃO FINAL
echo "=== ✅ VERIFICAÇÃO FINAL ==="
sleep 2

echo "🔍 Contagem após limpeza:"
AFTER_COUNT=$(curl -s http://localhost:3001/instances | jq '.instances | length' 2>/dev/null || echo "0")
echo "Instâncias depois: $AFTER_COUNT"

echo "🔍 Health check:"
curl -s http://localhost:3001/health | jq '.status' 2>/dev/null || echo "Servidor respondendo"

echo "=== 🎉 LIMPEZA COMPLETA FINALIZADA ==="
echo "📊 Resumo:"
echo "   - Antes: $BEFORE_COUNT instâncias"
echo "   - Depois: $AFTER_COUNT instâncias"
echo "   - Deletadas: $((BEFORE_COUNT - AFTER_COUNT)) instâncias"
echo "Data/Hora: $(date)"
