#!/bin/bash

# 🔍 ANÁLISE DOS ARQUIVOS ATUAIS DA VPS
echo "🔍 ANÁLISE COMPLETA DOS ARQUIVOS DA VPS"
echo "Para planejar correção @lid correta"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@31.97.163.57"
VPS_PATH="/root/whatsapp-server"

echo ""
echo "📊 1. STATUS ATUAL DO SISTEMA"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📊 Status PM2 atual:'
pm2 list

echo ''
echo '🌐 Testando resposta HTTP:'
curl -s http://localhost:3001/health | head -3 || echo 'HTTP não responde'

echo ''
echo '📋 Verificando porta em uso:'
netstat -tlnp | grep :3001 || echo 'Porta 3001 não está em uso'

echo ''
echo '📝 Verificando processo Node.js:'
ps aux | grep 'whatsapp-server/server.js' | grep -v grep
"

echo ""
echo "📄 2. ANALISANDO SERVER.JS ATUAL"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📄 Estrutura básica do server.js:'
echo '🔍 Verificando imports:'
head -20 server.js | grep -E 'require|import'

echo ''
echo '🔍 Verificando middleware express:'
grep -n -A2 -B2 'app.use\|app.listen' server.js | head -15

echo ''
echo '🔍 Verificando endpoints health:'
grep -n -A5 -B2 '/health' server.js

echo ''
echo '📊 Tamanho do server.js:'
wc -l server.js
"

echo ""
echo "🔗 3. ANALISANDO CONNECTION-MANAGER.JS ATUAL"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📄 Estrutura do connection-manager:'
echo '🔍 Constructor:'
grep -n -A5 'constructor' src/utils/connection-manager.js | head -10

echo ''
echo '🔍 Verificando processamento @lid atual:'
grep -n -A3 -B3 '@lid' src/utils/connection-manager.js | head -15

echo ''
echo '🔍 Verificando método attemptLidCorrection:'
grep -n -A5 'attemptLidCorrection' src/utils/connection-manager.js | head -10

echo ''
echo '🔍 Verificando limpeza de telefone:'
grep -n -A3 -B3 'Limpeza de telefone' src/utils/connection-manager.js | head -10

echo ''
echo '📊 Tamanho do connection-manager:'
wc -l src/utils/connection-manager.js
"

echo ""
echo "⚙️ 4. ANALISANDO ECOSYSTEM.CONFIG.JS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '⚙️ Configuração PM2 atual:'
cat ecosystem.config.js

echo ''
echo '🔍 Verificando limites de memória:'
grep -A3 -B3 'max_memory_restart' ecosystem.config.js
"

echo ""
echo "📋 5. VERIFICANDO LOGS DETALHADOS DO ERRO"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📋 Logs de inicialização (últimas 20 linhas):'
pm2 logs whatsapp-server --lines 20 --nostream | tail -20

echo ''
echo '🔍 Procurando erros específicos:'
pm2 logs whatsapp-server --lines 50 --nostream | grep -E 'error|Error|ERROR' | tail -5

echo ''
echo '🎯 Procurando por @lid nos logs:'
pm2 logs whatsapp-server --lines 30 --nostream | grep '@lid' | tail -5
"

echo ""
echo "🔍 6. VERIFICANDO DEPENDÊNCIAS E MÓDULOS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📦 Package.json - dependências principais:'
grep -A10 -B5 'dependencies' package.json | head -20

echo ''
echo '🔍 Verificando se Baileys está funcionando:'
node -e \"console.log('Node.js funcionando'); try { const baileys = require('@whiskeysockets/baileys'); console.log('Baileys OK'); } catch(e) { console.log('Baileys ERRO:', e.message); }\"

echo ''
echo '🔍 Estrutura de diretórios:'
ls -la | head -10
ls -la src/utils/ | head -5
"

echo ""
echo "🌐 7. DIAGNÓSTICO DE REDE E PORTAS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🌐 Verificando portas em uso:'
netstat -tlnp | grep -E ':300[1-5]'

echo ''
echo '🔍 Testando localhost diretamente:'
curl -v http://localhost:3001/health 2>&1 | head -10

echo ''
echo '🔍 Verificando se Express está rodando:'
ps aux | grep node | grep -v grep
"

echo ""
echo "✅ ANÁLISE COMPLETA FINALIZADA"
echo "================================================="
echo "📊 Dados coletados para planejamento da correção @lid"