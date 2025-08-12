#!/bin/bash
# COMANDOS SEGUROS PARA CORRIGIR SINCRONIZAÇÃO - SEM AFETAR INSTÂNCIAS CONECTADAS

echo "🔧 CORREÇÃO SEGURA DA SINCRONIZAÇÃO WHATSAPP"
echo "📅 $(date)"
echo "⚠️  MANTÉM TODAS AS INSTÂNCIAS CONECTADAS"
echo ""

echo "1️⃣ CONECTAR NA VPS:"
echo "ssh root@31.97.163.57"
echo ""

echo "2️⃣ BACKUP APENAS DO WEBHOOK (segurança):"
echo "cp /root/supabase/functions/auto_whatsapp_sync/index.ts /root/supabase/functions/auto_whatsapp_sync/index.ts.backup-\$(date +%Y%m%d_%H%M%S)"
echo ""

echo "3️⃣ VERIFICAR STATUS ATUAL DAS INSTÂNCIAS:"
echo "curl -s http://localhost:3001/status | jq '.instances[] | {instanceId, phone, status, connected}'"
echo ""

echo "4️⃣ SUBSTITUIR WEBHOOK COM VERSÃO SEGURA:"
echo "# Copie o conteúdo do arquivo fix_sync_only.ts"
echo "cat > /root/supabase/functions/auto_whatsapp_sync/index.ts << 'EOF'"
echo "# COLE AQUI O CONTEÚDO DO ARQUIVO fix_sync_only.ts"
echo "EOF"
echo ""

echo "5️⃣ TESTAR O WEBHOOK CORRIGIDO:"
echo "# Fazer uma requisição de teste para verificar se não quebrou nada"
echo "curl -X POST http://localhost:3001/health"
echo ""

echo "6️⃣ MONITORAR LOGS DO WEBHOOK:"
echo "# Observe se ainda há loops ou alterações incorretas de números"
echo "tail -f /root/whatsapp-server/server.log | grep -E '(phone|Auto WhatsApp Sync)'"
echo ""

echo "7️⃣ VERIFICAR SE NÚMEROS ESTÃO PRESERVADOS:"
echo "curl -s http://localhost:3001/status | jq '.instances[] | select(.phone != null) | {instanceId, phone, status}'"
echo ""

echo "✅ ESTA CORREÇÃO:"
echo "   - Mantém todas as instâncias conectadas"
echo "   - Preserva os números de telefone corretos"
echo "   - Corrige apenas a sincronização"
echo "   - Elimina o loop de alterações incorretas"
echo ""
echo "❌ NÃO VAI:"
echo "   - Desconectar instâncias"
echo "   - Alterar números existentes"
echo "   - Quebrar conexões ativas"