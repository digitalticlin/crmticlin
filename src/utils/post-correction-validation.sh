
#!/bin/bash

# VALIDAÇÃO PÓS-CORREÇÃO DEFINITIVA
echo "🔍 VALIDAÇÃO PÓS-CORREÇÃO DEFINITIVA"
echo "===================================="

echo "📅 Data: $(date)"
echo ""

echo "🔍 VERIFICAÇÃO 1: PROCESSO PM2"
echo "============================="

echo "📋 Status do processo whatsapp-main-3002:"
pm2 list | grep whatsapp-main-3002

echo ""
echo "📋 Informações detalhadas do processo:"
pm2 info whatsapp-main-3002

echo ""
echo "🔍 VERIFICAÇÃO 2: LOGS DE INICIALIZAÇÃO"
echo "======================================"

echo "📋 Últimas 15 linhas dos logs (procurando por correções):"
pm2 logs whatsapp-main-3002 --lines 15

echo ""
echo "🔍 VERIFICAÇÃO 3: TESTE DE CONECTIVIDADE"
echo "======================================="

echo "📋 Testando endpoint de health com correção:"
curl -s "http://localhost:3002/health" | jq '.'

echo ""
echo "📋 Testando endpoint de status com correção:"
curl -s "http://localhost:3002/status" | jq '.'

echo ""
echo "🔍 VERIFICAÇÃO 4: VERIFICAR PROBLEMAS CONHECIDOS"
echo "==============================================="

echo "📋 Procurando por 'Protocol error' nos logs:"
pm2 logs whatsapp-main-3002 --lines 20 | grep -i "protocol error" && echo "❌ Protocol errors encontrados" || echo "✅ Nenhum Protocol error encontrado"

echo ""
echo "📋 Procurando por 'Session closed' nos logs:"
pm2 logs whatsapp-main-3002 --lines 20 | grep -i "session closed" && echo "❌ Session closed encontrado" || echo "✅ Nenhum Session closed encontrado"

echo ""
echo "📋 Procurando por 'SyntaxError' nos logs:"
pm2 logs whatsapp-main-3002 --lines 20 | grep -i "syntaxerror" && echo "❌ Syntax errors encontrados" || echo "✅ Nenhum Syntax error encontrado"

echo ""
echo "📋 Procurando por 'CORREÇÃO DEFINITIVA' nos logs:"
pm2 logs whatsapp-main-3002 --lines 20 | grep -i "correção definitiva" && echo "✅ Correção definitiva detectada nos logs" || echo "⚠️ Correção definitiva não detectada nos logs"

echo ""
echo "🔍 VERIFICAÇÃO 5: ARQUIVOS E ESTRUTURA"
echo "====================================="

echo "📋 Verificando arquivo principal:"
ls -la vps-server-persistent.js

echo ""
echo "📋 Verificando primeiras linhas do arquivo (deve ser código JavaScript):"
head -5 vps-server-persistent.js

echo ""
echo "📋 Verificando se há diretório de persistência:"
ls -la whatsapp_instances/ 2>/dev/null && echo "✅ Diretório de persistência existe" || echo "⚠️ Diretório de persistência não existe"

echo ""
echo "🔍 VERIFICAÇÃO 6: RECURSOS DO SISTEMA"
echo "==================================="

echo "📋 Uso de memória:"
free -h

echo ""
echo "📋 Uso de CPU:"
top -bn1 | grep "Cpu(s)"

echo ""
echo "📋 Espaço em disco:"
df -h /

echo ""
echo "✅ VALIDAÇÃO PÓS-CORREÇÃO CONCLUÍDA!"
echo "===================================="

echo ""
echo "📋 RESUMO:"
echo "   - Se não houver Protocol errors: ✅ Correção bem-sucedida"
echo "   - Se não houver Session closed: ✅ Correção bem-sucedida"  
echo "   - Se não houver Syntax errors: ✅ Arquivo aplicado corretamente"
echo "   - Se CORREÇÃO DEFINITIVA aparecer nos logs: ✅ Arquivo correto aplicado"

echo ""
echo "📋 SE TUDO ESTIVER OK, EXECUTE:"
echo "   ./test-definitive-correction.sh"
