#!/bin/bash

echo "🔬 DEBUG COMPLETO DO STORE"
echo "=========================="

# 1. Verificar debug endpoint básico
echo "📊 1. DEBUG BÁSICO DO STORE:"
curl -s http://localhost:3002/debug/store/contatoluizantoniooliveira | jq '.'

echo ""
echo "🗃️ 2. VERIFICAR ARQUIVOS LOCAIS:"
ls -la /root/whatsapp-server/store.json 2>/dev/null && echo "Store file existe" || echo "Store file não existe"
ls -la /root/whatsapp-server/instances.json 2>/dev/null && echo "Instances file existe" || echo "Instances file não existe"

echo ""
echo "📁 3. VERIFICAR AUTH DIRECTORY:"
ls -la /root/whatsapp-server/auth_info/contatoluizantoniooliveira/ 2>/dev/null | head -5

echo ""
echo "🧪 4. TESTE DIRETO NO STORE (NODE SCRIPT):"
cat > /tmp/debug-store.js << 'EOF'
const fs = require('fs');
const path = require('path');

console.log('=== DEBUG STORE DIRETO ===');

// Verificar store.json
const storeFile = '/root/whatsapp-server/store.json';
if (fs.existsSync(storeFile)) {
  try {
    const storeData = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
    console.log('📁 Store.json encontrado:');
    console.log('   - Contacts:', Object.keys(storeData.contacts || {}).length);
    console.log('   - Chats:', Object.keys(storeData.chats || {}).length);
    console.log('   - Messages:', Object.keys(storeData.messages || {}).length);
    
    if (storeData.contacts) {
      console.log('👥 Primeiros 5 contatos:');
      Object.keys(storeData.contacts).slice(0, 5).forEach(key => {
        console.log(`   - ${key}: ${JSON.stringify(storeData.contacts[key]).substring(0, 100)}...`);
      });
    }
    
    if (storeData.chats) {
      console.log('💬 Primeiros 5 chats:');
      Object.keys(storeData.chats).slice(0, 5).forEach(key => {
        const chat = storeData.chats[key];
        console.log(`   - ${key}: name="${chat.name || 'N/A'}", id="${chat.id || 'N/A'}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao ler store.json:', error.message);
  }
} else {
  console.log('❌ store.json não encontrado');
}

// Verificar instances.json
const instancesFile = '/root/whatsapp-server/instances.json';
if (fs.existsSync(instancesFile)) {
  try {
    const instancesData = JSON.parse(fs.readFileSync(instancesFile, 'utf8'));
    console.log('📱 Instances.json encontrado:');
    console.log('   - Instâncias:', Object.keys(instancesData).length);
    Object.keys(instancesData).forEach(key => {
      const instance = instancesData[key];
      console.log(`   - ${key}: status="${instance.status}", connected=${instance.connected}`);
    });
  } catch (error) {
    console.error('❌ Erro ao ler instances.json:', error.message);
  }
} else {
  console.log('❌ instances.json não encontrado');
}
EOF

node /tmp/debug-store.js

echo ""
echo "📨 5. TESTE ENDPOINT DETALHADO:"
curl -X POST http://localhost:3002/instance/contatoluizantoniooliveira/import-history \
  -H "Content-Type: application/json" \
  -d '{"importType": "contacts", "batchSize": 5, "lastSyncTimestamp": null}' \
  | jq '.'

echo ""
echo "🔍 6. LOGS RECENTES DO PM2:"
pm2 logs whatsapp-server --lines 15 | grep -E "(Import History|Store|contacts|chats)"

echo ""
echo "🎯 DEBUG CONCLUÍDO"
echo "==================" 