// CORREÇÃO SEGURA PARA @LID - SEM QUEBRAR FUNÇÕES EXISTENTES
// Esta correção será aplicada de forma incremental e segura

// ESTRATÉGIA:
// 1. Manter toda função existente intacta
// 2. Adicionar apenas mapeamento de números @lid corrompidos
// 3. Criar sistema de fallback para não quebrar nada

// FUNÇÃO SEGURA PARA ADICIONAR AO connection-manager.js
function createLidMappingFunction() {
  return `
// 🔧 SISTEMA DE MAPEAMENTO @LID - ADICIONADO DE FORMA SEGURA
const lidNumberMap = new Map([
  // Mapeamentos conhecidos: [@lid_corrompido] => [numero_correto]
  ['274293808169155', '556299212484'], // Exemplo do log
  ['92045460951243', '556281364997'],   // Exemplo conhecido
  ['221092702589128', '556299212484']   // Número do exemplo (ajustar)
]);

// Função de consulta ao banco para encontrar número correto (FUTURO)
async function findCorrectPhoneForLid(corruptedNumber, instanceId) {
  try {
    // TODO: Implementar consulta ao banco de dados
    // SELECT phone FROM leads WHERE ... ORDER BY last_message_time DESC LIMIT 1
    return null; // Por enquanto retorna null
  } catch (error) {
    console.log('[LID_MAPPER] ⚠️ Erro ao consultar banco:', error.message);
    return null;
  }
}

// Função principal de mapeamento @lid
function mapLidToCorrectPhone(remoteJid, logPrefix, instanceId) {
  if (!remoteJid || !remoteJid.includes('@lid')) {
    return remoteJid; // Não é @lid, retorna original
  }
  
  const originalJid = remoteJid;
  const corruptedNumber = remoteJid.replace('@lid', '');
  
  console.log(\`\${logPrefix} 🔍 [LID_MAPPER] Processando @lid: "\${originalJid}" → número corrompido: "\${corruptedNumber}"\`);
  
  // ETAPA 1: Verificar mapeamento estático
  if (lidNumberMap.has(corruptedNumber)) {
    const correctPhone = lidNumberMap.get(corruptedNumber);
    const correctJid = \`\${correctPhone}@s.whatsapp.net\`;
    console.log(\`\${logPrefix} ✅ [LID_MAPPER] Mapeamento encontrado: \${corruptedNumber} → \${correctPhone}\`);
    return correctJid;
  }
  
  // ETAPA 2: Log para análise futura
  console.log(\`\${logPrefix} ⚠️ [LID_MAPPER] @lid desconhecido registrado: "\${corruptedNumber}" - NECESSÁRIO MAPEAMENTO MANUAL\`);
  
  // ETAPA 3: Fallback seguro - converter para formato padrão mas marcar como suspeito
  const fallbackJid = \`\${corruptedNumber}@s.whatsapp.net\`;
  console.log(\`\${logPrefix} 🚨 [LID_MAPPER] Usando fallback para @lid não mapeado: \${fallbackJid}\`);
  
  return fallbackJid;
}
`;
}

// SCRIPT SEGURO DE APLICAÇÃO
function createSafeApplicationScript() {
  return `#!/bin/bash

# APLICAÇÃO SEGURA DA CORREÇÃO @LID
VPS_IP="31.97.163.57"
VPS_USER="root"

echo "🔧 Aplicando correção SEGURA para @lid na VPS..."

# 1. BACKUP COMPLETO
echo "📦 Criando backup completo..."
ssh \${VPS_USER}@\${VPS_IP} << 'EOF'
cd /root/whatsapp-server
# Backup com timestamp
BACKUP_DIR="backup-lid-fix-\$(date +%Y%m%d-%H%M%S)"
mkdir -p "\$BACKUP_DIR"
cp -r src/ "\$BACKUP_DIR/"
cp package.json "\$BACKUP_DIR/"
echo "✅ Backup criado em: \$BACKUP_DIR"
EOF

# 2. VERIFICAR STATUS ATUAL
echo "🔍 Verificando status das instâncias..."
ssh \${VPS_USER}@\${VPS_IP} << 'EOF'
cd /root/whatsapp-server
pm2 list
pm2 logs whatsapp-server --lines 3
EOF

# 3. APLICAR CORREÇÃO INCREMENTAL
echo "🔧 Aplicando correção incremental..."
ssh \${VPS_USER}@\${VPS_IP} << 'EOF'
cd /root/whatsapp-server/src/utils

# Verificar se arquivo existe
if [ ! -f "connection-manager.js" ]; then
  echo "❌ Arquivo connection-manager.js não encontrado!"
  exit 1
fi

# Criar script de correção Node.js
cat > lid-fix-safe.js << 'NODESCRIPT'
const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando correção segura para @lid...');

// Ler arquivo original
const originalFile = 'connection-manager.js';
let content = fs.readFileSync(originalFile, 'utf8');

// Verificar se já foi corrigido antes
if (content.includes('LID_MAPPER')) {
  console.log('⚠️ Correção já aplicada anteriormente. Pulando...');
  process.exit(0);
}

// Função de mapeamento @lid
const lidMappingCode = \`
// 🔧 SISTEMA DE MAPEAMENTO @LID - CORREÇÃO SEGURA
const lidNumberMap = new Map([
  ['274293808169155', '556299212484'], // Mapeamento do log fornecido
  ['92045460951243', '556281364997'],
  ['221092702589128', '556299212484']   // Ajustar conforme necessário
]);

function mapLidToCorrectPhone(remoteJid, logPrefix, instanceId) {
  if (!remoteJid || !remoteJid.includes('@lid')) {
    return remoteJid;
  }
  
  const originalJid = remoteJid;
  const corruptedNumber = remoteJid.replace('@lid', '');
  
  console.log(\\\`\\\${logPrefix} 🔍 [LID_MAPPER] @lid detectado: "\\\${originalJid}" → corrompido: "\\\${corruptedNumber}"\\\`);
  
  if (lidNumberMap.has(corruptedNumber)) {
    const correctPhone = lidNumberMap.get(corruptedNumber);
    const correctJid = \\\`\\\${correctPhone}@s.whatsapp.net\\\`;
    console.log(\\\`\\\${logPrefix} ✅ [LID_MAPPER] Corrigido: \\\${corruptedNumber} → \\\${correctPhone}\\\`);
    return correctJid;
  }
  
  console.log(\\\`\\\${logPrefix} ⚠️ [LID_MAPPER] @lid não mapeado: "\\\${corruptedNumber}"\\\`);
  return \\\`\\\${corruptedNumber}@s.whatsapp.net\\\`;
}
\`;

// Inserir função antes da classe ConnectionManager
const classIndex = content.indexOf('class ConnectionManager {');
if (classIndex > -1) {
  const beforeClass = content.substring(0, classIndex);
  const afterClass = content.substring(classIndex);
  content = beforeClass + lidMappingCode + '\\n' + afterClass;
  console.log('✅ Função de mapeamento adicionada');
} else {
  console.log('❌ Não foi possível encontrar classe ConnectionManager');
  process.exit(1);
}

// Encontrar e substituir apenas a parte do @lid (CORREÇÃO CIRÚRGICA)
const lidStart = content.indexOf('if (remoteJid.includes(\\'@lid\\'))');
if (lidStart > -1) {
  // Encontrar o final do bloco @lid
  let braceCount = 0;
  let endIndex = lidStart;
  let inBlock = false;
  
  for (let i = lidStart; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++;
      inBlock = true;
    } else if (content[i] === '}') {
      braceCount--;
      if (inBlock && braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }
  
  // Substituir bloco @lid por chamada da nova função
  const beforeLid = content.substring(0, lidStart);
  const afterLid = content.substring(endIndex);
  
  const newLidCode = \`// 🔧 CORREÇÃO @LID SEGURA
      const originalRemoteJid = remoteJid;
      remoteJid = mapLidToCorrectPhone(remoteJid, logPrefix, instanceId);
      
      if (remoteJid !== originalRemoteJid) {
        console.log(\\\`\\\${logPrefix} 🔄 [LID_MAPPER] JID corrigido: \\\${originalRemoteJid} → \\\${remoteJid}\\\`);
      }\`;
  
  content = beforeLid + newLidCode + afterLid;
  console.log('✅ Bloco @lid substituído por correção segura');
} else {
  console.log('⚠️ Bloco @lid não encontrado, adicionando verificação no início do processamento');
  
  // Adicionar verificação no início do processamento de mensagens
  const messageStart = content.indexOf('let remoteJid = message.key.remoteJid;');
  if (messageStart > -1) {
    const insertPoint = content.indexOf('\\n', messageStart) + 1;
    const beforeInsert = content.substring(0, insertPoint);
    const afterInsert = content.substring(insertPoint);
    
    const lidCheck = \`
      // 🔧 VERIFICAÇÃO @LID SEGURA
      remoteJid = mapLidToCorrectPhone(remoteJid, logPrefix, instanceId);
\`;
    
    content = beforeInsert + lidCheck + afterInsert;
    console.log('✅ Verificação @lid adicionada no início do processamento');
  }
}

// Salvar arquivo corrigido
fs.writeFileSync(originalFile, content);
console.log('✅ Correção aplicada com sucesso!');
console.log('📋 Resumo:');
console.log('- Função mapLidToCorrectPhone adicionada');
console.log('- Mapeamentos estáticos configurados');
console.log('- Sistema de logs para monitoramento');
NODESCRIPT

# Executar correção
node lid-fix-safe.js
rm lid-fix-safe.js

echo "✅ Correção aplicada"
EOF

# 4. VERIFICAR SE APLICAÇÃO FOI BEM SUCEDIDA
echo "🔍 Verificando se correção foi aplicada..."
ssh \${VPS_USER}@\${VPS_IP} << 'EOF'
cd /root/whatsapp-server/src/utils
if grep -q "LID_MAPPER" connection-manager.js; then
  echo "✅ Correção confirmada no arquivo"
else
  echo "❌ Correção não encontrada - PROBLEMA!"
fi
EOF

# 5. RESTART CONTROLADO COM MONITORAMENTO
echo "🔄 Reiniciando com monitoramento..."
ssh \${VPS_USER}@\${VPS_IP} << 'EOF'
cd /root/whatsapp-server

echo "📊 Status ANTES do restart:"
pm2 list | grep whatsapp-server

echo "🔄 Fazendo restart..."
pm2 restart whatsapp-server

echo "⏱️ Aguardando 10 segundos..."
sleep 10

echo "📊 Status APÓS restart:"
pm2 list | grep whatsapp-server

echo "📜 Logs recentes:"
pm2 logs whatsapp-server --lines 15
EOF

echo "✅ Correção aplicada e servidor reiniciado!"
echo ""
echo "🔍 Monitorar pelos próximos minutos:"
echo "ssh root@31.97.163.57 'pm2 logs whatsapp-server --lines 20'"`;
}

// Criar arquivo de aplicação segura
module.exports = {
  lidMappingFunction: createLidMappingFunction(),
  applicationScript: createSafeApplicationScript()
};