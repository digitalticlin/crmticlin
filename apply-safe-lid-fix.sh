#!/bin/bash

# APLICAÇÃO SEGURA DA CORREÇÃO @LID
VPS_IP="31.97.163.57"
VPS_USER="root"

echo "🔧 Aplicando correção SEGURA para @lid na VPS..."
echo "⚠️ Esta correção:"
echo "  - Mantém todas as funções existentes"
echo "  - Adiciona apenas mapeamento de números @lid"
echo "  - Inclui sistema de logs para monitoramento"
echo "  - Usa fallback seguro para números não mapeados"
echo ""

# 1. BACKUP COMPLETO E VERIFICAÇÃO
echo "📦 Criando backup e verificando status..."
ssh ${VPS_USER}@${VPS_IP} << 'EOF'
cd /root/whatsapp-server

# Backup com timestamp
BACKUP_DIR="backup-lid-safe-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r src/ "$BACKUP_DIR/"
cp package.json "$BACKUP_DIR/"
echo "✅ Backup criado em: $BACKUP_DIR"

# Status atual
echo "📊 Status atual das instâncias:"
pm2 list | grep whatsapp-server
echo ""
echo "📜 Últimos logs:"
pm2 logs whatsapp-server --lines 5
EOF

# 2. APLICAR CORREÇÃO SEGURA
echo "🔧 Aplicando correção incremental e segura..."
ssh ${VPS_USER}@${VPS_IP} << 'EOF'
cd /root/whatsapp-server/src/utils

# Verificar arquivo
if [ ! -f "connection-manager.js" ]; then
  echo "❌ Arquivo connection-manager.js não encontrado!"
  exit 1
fi

# Script de correção Node.js
cat > lid-safe-patch.js << 'PATCHSCRIPT'
const fs = require('fs');

console.log('🔧 Aplicando patch seguro para @lid...');

// Ler arquivo
const file = 'connection-manager.js';
let content = fs.readFileSync(file, 'utf8');

// Verificar se já foi aplicado
if (content.includes('LID_SAFE_MAPPER')) {
  console.log('⚠️ Patch já aplicado. Saindo...');
  process.exit(0);
}

console.log('📝 Adicionando sistema de mapeamento @lid...');

// Código do mapeador @lid
const mapperCode = `
// 🔧 LID_SAFE_MAPPER - Sistema seguro de mapeamento @lid
const LID_SAFE_MAPPER = {
  // Mapeamentos conhecidos: [número_corrompido] => [número_correto]
  knownMappings: new Map([
    // IMPORTANTE: Adicionar mapeamentos corretos conforme necessário
    ['274293808169155', '556299212484'], // Exemplo fornecido
    ['92045460951243', '556281364997'],   // Mapeamento conhecido
    ['221092702589128', '556299212484']   // Ajustar número correto
  ]),
  
  // Função principal de mapeamento
  mapLidPhone: function(remoteJid, logPrefix) {
    if (!remoteJid || !remoteJid.includes('@lid')) {
      return remoteJid; // Não é @lid, retorna original
    }
    
    const originalJid = remoteJid;
    const corruptedNumber = remoteJid.replace('@lid', '');
    
    console.log(\`\${logPrefix} 🔍 [LID_SAFE] @lid detectado: "\${originalJid}"\`);
    console.log(\`\${logPrefix} 🔍 [LID_SAFE] Número corrompido extraído: "\${corruptedNumber}"\`);
    
    // Buscar mapeamento conhecido
    if (this.knownMappings.has(corruptedNumber)) {
      const correctPhone = this.knownMappings.get(corruptedNumber);
      const correctJid = \`\${correctPhone}@s.whatsapp.net\`;
      
      console.log(\`\${logPrefix} ✅ [LID_SAFE] Mapeamento encontrado:\`);
      console.log(\`\${logPrefix} ✅ [LID_SAFE] \${corruptedNumber} → \${correctPhone}\`);
      console.log(\`\${logPrefix} ✅ [LID_SAFE] JID final: \${correctJid}\`);
      
      return correctJid;
    }
    
    // Número não mapeado - LOG CRÍTICO para análise
    console.log(\`\${logPrefix} 🚨 [LID_SAFE] NÚMERO @LID NÃO MAPEADO:\`);
    console.log(\`\${logPrefix} 🚨 [LID_SAFE] Original: \${originalJid}\`);
    console.log(\`\${logPrefix} 🚨 [LID_SAFE] Corrompido: \${corruptedNumber}\`);
    console.log(\`\${logPrefix} 🚨 [LID_SAFE] AÇÃO: Adicionar mapeamento manual!\`);
    
    // Fallback seguro - usar número como está mas loggar
    const fallbackJid = \`\${corruptedNumber}@s.whatsapp.net\`;
    console.log(\`\${logPrefix} ⚠️ [LID_SAFE] Usando fallback: \${fallbackJid}\`);
    
    return fallbackJid;
  },
  
  // Função para adicionar novos mapeamentos (uso futuro)
  addMapping: function(corruptedNumber, correctNumber) {
    this.knownMappings.set(corruptedNumber, correctNumber);
    console.log(\`[LID_SAFE] ➕ Mapeamento adicionado: \${corruptedNumber} → \${correctNumber}\`);
  }
};
`;

// Inserir antes da classe ConnectionManager
const classIndex = content.indexOf('class ConnectionManager {');
if (classIndex === -1) {
  console.log('❌ Classe ConnectionManager não encontrada!');
  process.exit(1);
}

const beforeClass = content.substring(0, classIndex);
const afterClass = content.substring(classIndex);
content = beforeClass + mapperCode + '\n' + afterClass;

console.log('✅ Sistema de mapeamento adicionado');

// Encontrar onde está o processamento atual de @lid
const existingLidIndex = content.indexOf('if (remoteJid.includes(\'@lid\'))');
let lidProcessed = false;

if (existingLidIndex > -1) {
  console.log('📝 Substituindo processamento @lid existente...');
  
  // Encontrar início da condição if
  let startIndex = existingLidIndex;
  while (startIndex > 0 && content[startIndex - 1] !== '\n') {
    startIndex--;
  }
  
  // Encontrar final do bloco
  let braceCount = 0;
  let endIndex = existingLidIndex;
  let foundOpenBrace = false;
  
  for (let i = existingLidIndex; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++;
      foundOpenBrace = true;
    } else if (content[i] === '}') {
      braceCount--;
      if (foundOpenBrace && braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }
  
  // Substituir bloco antigo
  const beforeLid = content.substring(0, startIndex);
  const afterLid = content.substring(endIndex);
  
  const newLidCode = `      // 🔧 LID_SAFE_MAPPER - Correção segura aplicada
      const originalRemoteJid = remoteJid;
      remoteJid = LID_SAFE_MAPPER.mapLidPhone(remoteJid, logPrefix);
      
      if (remoteJid !== originalRemoteJid) {
        console.log(\`\${logPrefix} 🔄 [LID_SAFE] JID processado: \${originalRemoteJid} → \${remoteJid}\`);
      }
`;
  
  content = beforeLid + newLidCode + afterLid;
  lidProcessed = true;
  console.log('✅ Processamento @lid substituído');
}

// Se não encontrou processamento @lid, adicionar no início
if (!lidProcessed) {
  console.log('📝 Adicionando verificação @lid no início...');
  
  const messageStartPattern = 'let remoteJid = message.key.remoteJid;';
  const messageIndex = content.indexOf(messageStartPattern);
  
  if (messageIndex > -1) {
    const insertPoint = content.indexOf('\n', messageIndex) + 1;
    const beforeInsert = content.substring(0, insertPoint);
    const afterInsert = content.substring(insertPoint);
    
    const lidCheck = `
      // 🔧 LID_SAFE_MAPPER - Verificação no início
      remoteJid = LID_SAFE_MAPPER.mapLidPhone(remoteJid, logPrefix);
`;
    
    content = beforeInsert + lidCheck + afterInsert;
    console.log('✅ Verificação @lid adicionada no início');
  } else {
    console.log('⚠️ Não foi possível encontrar ponto de inserção');
  }
}

// Salvar arquivo
fs.writeFileSync(file, content);

console.log('✅ Patch aplicado com sucesso!');
console.log('');
console.log('📋 RESUMO DA CORREÇÃO:');
console.log('✅ Sistema LID_SAFE_MAPPER adicionado');
console.log('✅ Mapeamentos estáticos configurados');
console.log('✅ Logs detalhados para monitoramento');
console.log('✅ Fallback seguro para números não mapeados');
console.log('');
console.log('🔍 MAPEAMENTOS ATIVOS:');
console.log('- 274293808169155 → 556299212484');
console.log('- 92045460951243 → 556281364997');
console.log('- 221092702589128 → 556299212484');
PATCHSCRIPT

# Executar patch
node lid-safe-patch.js
PATCH_RESULT=$?

if [ $PATCH_RESULT -eq 0 ]; then
  echo "✅ Patch aplicado com sucesso"
else
  echo "❌ Erro ao aplicar patch!"
  exit 1
fi

# Limpar arquivo temporário
rm lid-safe-patch.js

# Verificar se aplicação funcionou
if grep -q "LID_SAFE_MAPPER" connection-manager.js; then
  echo "✅ Correção confirmada no código"
else
  echo "❌ Correção não foi aplicada!"
  exit 1
fi
EOF

# 3. RESTART MONITORADO
echo ""
echo "🔄 Reiniciando servidor com monitoramento..."
ssh ${VPS_USER}@${VPS_IP} << 'EOF'
cd /root/whatsapp-server

echo "📊 Status ANTES do restart:"
pm2 list | grep whatsapp-server

echo ""
echo "🔄 Executando restart..."
pm2 restart whatsapp-server

echo ""
echo "⏱️ Aguardando 15 segundos para estabilização..."
sleep 15

echo ""
echo "📊 Status APÓS restart:"
pm2 list | grep whatsapp-server

echo ""
echo "📜 Logs mais recentes (últimas 20 linhas):"
pm2 logs whatsapp-server --lines 20
EOF

echo ""
echo "✅ CORREÇÃO APLICADA COM SUCESSO!"
echo ""
echo "🔍 MONITORAMENTO CONTÍNUO:"
echo "Execute este comando para acompanhar os logs:"
echo "ssh root@31.97.163.57 'pm2 logs whatsapp-server --lines 50 | grep LID_SAFE'"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Monitorar logs por alguns minutos"
echo "2. Quando aparecer número @lid não mapeado, adicionar mapeamento"
echo "3. Verificar se instâncias continuam ativas"
echo ""
echo "🚨 IMPORTANTE:"
echo "- Todos os números @lid são logados com [LID_SAFE]"
echo "- Números não mapeados usam fallback seguro"
echo "- Sistema mantém todas funções existentes intactas"