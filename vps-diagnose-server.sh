#!/bin/bash

# 🔍 DIAGNÓSTICO RÁPIDO DO SERVIDOR VPS
echo "🔍 DIAGNÓSTICO RÁPIDO DO SERVIDOR VPS"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

echo ""
echo "📊 1. STATUS DO PM2"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH
pm2 status
echo ''
echo '📋 Processos PM2 detalhados:'
pm2 list
"

echo ""
echo "📋 2. LOGS RECENTES DO SERVIDOR"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH
echo '🔥 Últimas 15 linhas do log:'
pm2 logs whatsapp-server --lines 15 --nostream
"

echo ""
echo "🌐 3. TESTE DE CONECTIVIDADE"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH
echo '🧪 Testando health check:'
curl -s http://localhost:3001/health | head -10 || echo '❌ Servidor não responde'

echo ''
echo '🔌 Verificando portas:'
netstat -tlnp | grep -E ':(3001|3000)' || echo '❌ Nenhuma porta WhatsApp ativa'
"

echo ""
echo "📁 4. ESTRUTURA DE ARQUIVOS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH
echo '📂 Estrutura do projeto:'
ls -la

echo ''
echo '📋 Verificando arquivos críticos:'
echo '  server.js:' \$([ -f server.js ] && echo '✅ Existe' || echo '❌ Faltando')
echo '  package.json:' \$([ -f package.json ] && echo '✅ Existe' || echo '❌ Faltando')
echo '  ecosystem.config.js:' \$([ -f ecosystem.config.js ] && echo '✅ Existe' || echo '❌ Faltando')
echo '  node_modules/:' \$([ -d node_modules ] && echo '✅ Existe' || echo '❌ Faltando')

echo ''
echo '📱 Instâncias conectadas:'
ls -la auth_info/ 2>/dev/null | wc -l || echo '❌ Sem auth_info'
"

echo ""
echo "⚙️ 5. CONFIGURAÇÕES DO SISTEMA"
echo "================================================="
ssh $VPS_SERVER "
echo '🔧 Versão do Node:'
node --version

echo '🔧 Versão do PM2:'
pm2 --version

echo '🔧 Versão do NPM:'
npm --version

echo '🔧 Uso de memória:'
free -m

echo '🔧 Espaço em disco:'
df -h /
"

echo ""
echo "🔍 6. VERIFICAÇÃO DE ERROS COMUNS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🚨 Verificando por erros nos logs:'
if pm2 logs whatsapp-server --lines 50 --nostream | grep -i 'error\|exception\|failed' > /tmp/errors.log; then
    echo '❌ ERROS ENCONTRADOS:'
    head -10 /tmp/errors.log
else
    echo '✅ Nenhum erro crítico encontrado nos logs recentes'
fi

echo ''
echo '🔍 Verificando variáveis de ambiente:'
echo 'PORT:' \${PORT:-'Não definido'}
echo 'NODE_ENV:' \${NODE_ENV:-'Não definido'}
echo 'SUPABASE_SERVICE_KEY:' \$([ -n \"\$SUPABASE_SERVICE_KEY\" ] && echo 'Definido' || echo 'Não definido')
"

echo ""
echo "📊 RESUMO DO DIAGNÓSTICO"
echo "================================================="
echo "✅ Diagnóstico concluído!"
echo "🔍 Analise os resultados acima para identificar problemas"
echo ""
echo "🔧 PRÓXIMOS PASSOS COMUNS:"
echo "   1. Se PM2 não está rodando: pm2 start ecosystem.config.js"
echo "   2. Se há erros de porta: verificar PORT no .env"
echo "   3. Se faltam dependências: npm install"
echo "   4. Se há erros de import: verificar structure dos arquivos"