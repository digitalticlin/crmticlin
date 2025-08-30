#!/bin/bash

# 🔍 DEBUG: RASTREAMENTO DA CORRUPÇÃO DE NÚMEROS
# Monitorar logs da VPS para encontrar onde números estão sendo corrompidos

VPS_SERVER="root@vpswhatsapp.ticlin.com.br"

echo "🔍 DIAGNÓSTICO: CORRUPÇÃO DE NÚMEROS DE TELEFONE"
echo "================================================="
echo ""

echo "📱 PROBLEMA IDENTIFICADO:"
echo "   - Número real: +55 62 8124-2215"
echo "   - Número corrompido: +10 (72) 23925-702810"
echo "   - Nome incorreto: 107223925702810@s.whatsapp.net"
echo ""

echo "📊 1. VERIFICAR LOGS DO CONNECTION-MANAGER"
echo "=========================================="
ssh $VPS_SERVER "
echo '🔍 Últimas limpezas de telefone:'
pm2 logs whatsapp-server --lines 50 --nostream | grep 'Limpeza de telefone' | tail -10

echo ''
echo '🔍 Mensagens processadas recentemente:'
pm2 logs whatsapp-server --lines 100 --nostream | grep -E 'Nova mensagem de|from.*@s.whatsapp.net' | tail -10

echo ''
echo '🔍 Webhooks enviados:'
pm2 logs whatsapp-server --lines 100 --nostream | grep -E 'Webhook.*Backend.*OK|notifyMessage' | tail -5
"

echo ""
echo "📊 2. VERIFICAR LOGS DA EDGE FUNCTION"
echo "====================================="
echo "🔍 Verificando últimas mensagens processadas na edge webhook_whatsapp_web..."
echo ""

echo "📊 3. SIMULAÇÃO DE LIMPEZA"
echo "=========================="
ssh $VPS_SERVER "cd /root/whatsapp-server && node -e \"
// Simular método cleanPhoneNumber
function cleanPhoneNumber(jid) {
  if (!jid || typeof jid !== 'string') return jid;
  const phoneOnly = jid.split('@')[0];
  console.log(\`🔧 Teste limpeza: \${jid} → \${phoneOnly}\`);
  return phoneOnly;
}

// Testes com diferentes formatos
console.log('📱 TESTES DE FORMATAÇÃO:');
const testCases = [
  '556281242215@s.whatsapp.net',
  '5562812422115@s.whatsapp.net', 
  '107223925702810@s.whatsapp.net',
  '+5562812422115@s.whatsapp.net'
];

testCases.forEach(test => {
  const result = cleanPhoneNumber(test);
  console.log(\`   Input: \${test}\`);
  console.log(\`   Output: \${result}\`);
  console.log('');
});
\""

echo ""
echo "📊 4. VERIFICAR DADOS NO BANCO SUPABASE"
echo "======================================="
echo "🔍 Últimos leads salvos com números estranhos:"

echo "
SELECT 
  id,
  name,
  phone,
  created_at,
  import_source,
  updated_at
FROM leads 
WHERE phone ~ '^107|^10[^0-9]|length(phone) > 15|phone ~ '^[^5]'
ORDER BY created_at DESC 
LIMIT 10;
" > query_corrupt_phones.sql

echo "Consulta SQL criada: query_corrupt_phones.sql"
echo ""

echo "📊 5. VERIFICAR PADRÕES DE CORRUPÇÃO"
echo "===================================="
ssh $VPS_SERVER "cd /root/whatsapp-server && node -e \"
// Analisar padrão de corrupção observado
const realNumber = '556281242215';
const corruptNumber = '107223925702810';

console.log('🔍 ANÁLISE DO PADRÃO DE CORRUPÇÃO:');
console.log(\`   Número real:      \${realNumber}\`);
console.log(\`   Número corrompido: \${corruptNumber}\`);
console.log(\`   Diferença length:  \${corruptNumber.length - realNumber.length}\`);
console.log('');

// Verificar se há alguma transformação matemática
console.log('📊 POSSÍVEIS TRANSFORMAÇÕES:');
console.log(\`   Real como int:      \${parseInt(realNumber)}\`);
console.log(\`   Corrompido como int: \${parseInt(corruptNumber)}\`);
console.log('');

// Verificar overflow/underflow
console.log('🔢 VERIFICAR OVERFLOW:');
const maxSafeInt = Number.MAX_SAFE_INTEGER;
console.log(\`   MAX_SAFE_INTEGER: \${maxSafeInt}\`);
console.log(\`   Real number:      \${realNumber} (safe: \${parseInt(realNumber) <= maxSafeInt})\`);
console.log(\`   Corrupt number:   \${corruptNumber} (safe: \${parseInt(corruptNumber) <= maxSafeInt})\`);
\""

echo ""
echo "📊 6. VERIFICAR INSTÂNCIAS ATIVAS"
echo "================================="
ssh $VPS_SERVER "cd /root/whatsapp-server && 
echo '📱 Instâncias WhatsApp ativas:'
curl -s -H 'Authorization: Bearer $VPS_API_TOKEN' http://localhost:3001/instances | jq -r '.instances[] | \"\(.id): \(.phone // \"no phone\")\") 2>/dev/null || echo 'Token não configurado ou endpoint inacessível'
"

echo ""
echo "✅ DIAGNÓSTICO CONCLUÍDO"
echo "========================"
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Analisar os logs acima para identificar onde a corrupção acontece"
echo "   2. Verificar se é no connection-manager.js durante limpeza"
echo "   3. Verificar se é na edge function durante processamento"
echo "   4. Verificar se é na RPC do Supabase durante formatação"
echo "   5. Aplicar correção no local identificado"
echo ""