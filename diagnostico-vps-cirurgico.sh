#!/bin/bash

# DIAGNÓSTICO CIRÚRGICO VPS - PRESERVA SISTEMA ATUAL
echo "🔬 DIAGNÓSTICO CIRÚRGICO VPS - PORTA 3002"
echo "========================================"
echo "📅 $(date)"
echo ""

# 1. Verificar status PM2 detalhado
echo "📊 1. STATUS PM2 DETALHADO:"
pm2 show whatsapp-server
pm2 logs whatsapp-server --lines 20

# 2. Verificar se porta está sendo usada
echo "🔍 2. VERIFICAÇÃO DE PORTA 3002:"
netstat -tulpn | grep :3002
ss -tulpn | grep :3002
lsof -i :3002

# 3. Verificar processos Node.js
echo "⚡ 3. PROCESSOS NODE.JS ATIVOS:"
ps aux | grep node
pgrep -f node

# 4. Testar bind de porta manualmente
echo "🧪 4. TESTE MANUAL DE BIND NA PORTA:"
timeout 5s node -e "
const net = require('net');
const server = net.createServer();
server.listen(3003, '0.0.0.0', () => {
  console.log('✅ Bind teste na porta 3003 funcionou');
  server.close();
});
server.on('error', (err) => {
  console.log('❌ Erro no bind teste:', err.message);
});
"

# 5. Verificar logs do sistema
echo "📝 5. LOGS DO SISTEMA (últimos 10 min):"
journalctl --since "10 minutes ago" | grep -i "port\|bind\|listen\|3002" | tail -10

# 6. Verificar se Express está iniciando corretamente
echo "🚀 6. TESTE EXPRESS SIMPLES:"
timeout 10s node -e "
const express = require('express');
const app = express();
app.get('/test', (req, res) => res.json({test: 'ok'}));
const server = app.listen(3004, '0.0.0.0', () => {
  console.log('✅ Express teste na porta 3004 funcionou');
  setTimeout(() => {
    server.close();
    console.log('🔴 Servidor teste fechado');
  }, 3000);
});
server.on('error', (err) => {
  console.log('❌ Erro no Express teste:', err.message);
});
"

# 7. Verificar dependências críticas
echo "📦 7. VERIFICAÇÃO DE DEPENDÊNCIAS:"
cd /root/whatsapp-server
echo "Diretório atual: $(pwd)"
echo "Arquivos presentes:"
ls -la
echo ""
echo "Package.json existe:"
ls -la package.json 2>/dev/null || echo "❌ package.json não encontrado"
echo ""
echo "Node_modules existe:"
ls -la node_modules/ 2>/dev/null | head -5 || echo "❌ node_modules não encontrado"

# 8. Testar importação de módulos críticos
echo "🔧 8. TESTE DE MÓDULOS CRÍTICOS:"
node -e "
try {
  const express = require('express');
  console.log('✅ Express OK');
} catch(e) {
  console.log('❌ Express falhou:', e.message);
}

try {
  const baileys = require('@whiskeysockets/baileys');
  console.log('✅ Baileys OK');
} catch(e) {
  console.log('❌ Baileys falhou:', e.message);
}

try {
  const axios = require('axios');
  console.log('✅ Axios OK');
} catch(e) {
  console.log('❌ Axios falhou:', e.message);
}
"

# 9. Verificar sintaxe do server.js atual
echo "📋 9. VERIFICAÇÃO DE SINTAXE:"
node -c server.js && echo "✅ Sintaxe OK" || echo "❌ Erro de sintaxe"

# 10. Verificar primeiras linhas do server.js
echo "👀 10. PRIMEIRAS 5 LINHAS DO SERVER.JS:"
head -5 server.js

echo ""
echo "🔬 DIAGNÓSTICO CONCLUÍDO"
echo "=======================" 