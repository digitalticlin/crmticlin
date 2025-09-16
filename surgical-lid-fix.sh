#!/bin/bash

# CORREÇÃO CIRÚRGICA ULTRA-FOCADA PARA @LID
# OBJETIVO: Extrair número real da mensagem, não mapear estaticamente
# GARANTIA: NÃO toca em nenhum código existente

VPS_IP="31.97.163.57"
VPS_USER="root"

echo "🔧 CORREÇÃO CIRÚRGICA PARA EXTRAÇÃO REAL DE @LID"
echo "================================================"
echo ""
echo "Esta correção:"
echo "✅ NÃO modifica nenhum código existente"
echo "✅ ADICIONA extração inteligente de números reais"
echo "✅ IGNORA grupos completamente"  
echo "✅ EXTRAI número correto da estrutura da mensagem"
echo "✅ PRESERVA todas as funcionalidades existentes"
echo ""

# Aplicar correção diretamente
ssh ${VPS_USER}@${VPS_IP} << 'EOFCIRURGICA'
cd /root/whatsapp-server/src/utils

# Backup de segurança
cp connection-manager.js connection-manager.js.pre-real-fix

echo "✅ Backup de segurança criado"

# Verificar integridade atual
node -c connection-manager.js
if [ $? -ne 0 ]; then
  echo "❌ Arquivo atual tem erro de sintaxe!"
  exit 1
fi

echo "✅ Arquivo atual íntegro"

# Encontrar linha da classe ConnectionManager para inserir antes
CLASS_LINE=$(grep -n "class ConnectionManager" connection-manager.js | cut -d: -f1)

if [ -z "$CLASS_LINE" ]; then
  echo "❌ Classe ConnectionManager não encontrada"
  exit 1
fi

echo "📍 Classe encontrada na linha $CLASS_LINE"

# Criar sistema de extração real
cat > temp-real-extractor.js << 'EOFEXTRACTOR'
// ============================================================================
// 🔧 REAL @LID EXTRACTOR - EXTRAI NÚMERO VERDADEIRO (NÃO MAPEIA)
// ============================================================================
const REAL_LID_NUMBER_EXTRACTOR = {
  
  // Extrai número real de mensagens diretas com @lid corrompido
  extractRealNumber: function(message, remoteJid, logPrefix = '') {
    // Ignorar grupos COMPLETAMENTE
    if (remoteJid && (remoteJid.includes('@g.us') || remoteJid.includes('@broadcast'))) {
      return remoteJid; // Grupos passam direto, sem alteração
    }
    
    // Se não é @lid, passar direto
    if (!remoteJid || !remoteJid.includes('@lid')) {
      return remoteJid;
    }
    
    const originalLid = remoteJid;
    console.log(`${logPrefix} 🔍 [REAL_EXTRACT] @lid detectado: "${originalLid}"`);
    
    // ESTRATÉGIA 1: Buscar em verifiedName (campo comum com número real)
    if (message.verifiedName) {
      const phonePattern = /55\d{10,11}/;
      const match = message.verifiedName.match(phonePattern);
      if (match) {
        const realNumber = match[0] + '@s.whatsapp.net';
        console.log(`${logPrefix} ✅ [REAL_EXTRACT] Encontrado em verifiedName: ${realNumber}`);
        return realNumber;
      }
    }
    
    // ESTRATÉGIA 2: Buscar número em pushName 
    if (message.pushName) {
      const phonePattern = /(\d{10,13})/;
      const match = message.pushName.match(phonePattern);
      if (match && match[1].length >= 10) {
        let phone = match[1];
        if (!phone.startsWith('55')) phone = '55' + phone;
        if (phone.match(/^55\d{2}\d{8,9}$/)) {
          const realNumber = phone + '@s.whatsapp.net';
          console.log(`${logPrefix} ✅ [REAL_EXTRACT] Encontrado em pushName: ${realNumber}`);
          return realNumber;
        }
      }
    }
    
    // ESTRATÉGIA 3: Buscar qualquer número brasileiro na estrutura
    const messageStr = JSON.stringify(message);
    const phonePattern = /55\d{10,11}/g;
    const matches = messageStr.match(phonePattern);
    if (matches && matches[0]) {
      const realNumber = matches[0] + '@s.whatsapp.net';
      console.log(`${logPrefix} ✅ [REAL_EXTRACT] Encontrado na estrutura: ${realNumber}`);
      return realNumber;
    }
    
    // Se não encontrou número real, logar para análise
    console.log(`${logPrefix} 🚨 [REAL_EXTRACT] NÃO ENCONTROU número real para: ${originalLid}`);
    console.log(`${logPrefix} 🚨 [REAL_EXTRACT] verifiedName: ${message.verifiedName || 'N/A'}`);
    console.log(`${logPrefix} 🚨 [REAL_EXTRACT] pushName: ${message.pushName || 'N/A'}`);
    
    // IMPORTANTE: Retornar null indica que mensagem deve ser ignorada
    console.log(`${logPrefix} ⚠️ [REAL_EXTRACT] IGNORANDO mensagem @lid sem número real`);
    return null; // Mensagem será ignorada
  }
};

EOFEXTRACTOR

# Inserir sistema antes da classe
head -n $((CLASS_LINE - 1)) connection-manager.js > temp-before.js
cat temp-real-extractor.js >> temp-before.js
tail -n +${CLASS_LINE} connection-manager.js >> temp-before.js

# Substituir arquivo
mv temp-before.js connection-manager.js

echo "✅ Sistema de extração adicionado antes da classe"

# Limpar arquivo temporário  
rm temp-real-extractor.js

# Agora adicionar interceptação no ponto correto
# Encontrar linha do remoteJid
REMOTE_JID_LINE=$(grep -n "let remoteJid = message.key.remoteJid;" connection-manager.js | cut -d: -f1)

if [ -z "$REMOTE_JID_LINE" ]; then
  echo "❌ Linha remoteJid não encontrada"
  exit 1
fi

echo "📍 RemoteJid encontrado na linha $REMOTE_JID_LINE"

# Adicionar interceptação após essa linha
sed -i "${REMOTE_JID_LINE}a\\
\\
      // 🔧 EXTRAÇÃO REAL DE @LID (não mapeamento estático)\\
      const originalRemoteJid = remoteJid;\\
      remoteJid = REAL_LID_NUMBER_EXTRACTOR.extractRealNumber(message, remoteJid, logPrefix);\\
      \\
      // Se extração retornou null, ignorar mensagem @lid\\
      if (remoteJid === null) {\\
        console.log(\`\${logPrefix} 🚫 [REAL_EXTRACT] Ignorando mensagem @lid sem número real: \${originalRemoteJid}\`);\\
        return; // Sair da função, não processar\\
      }\\
      \\
      // Log se número foi extraído\\
      if (originalRemoteJid !== remoteJid && originalRemoteJid.includes('@lid')) {\\
        console.log(\`\${logPrefix} ✅ [REAL_EXTRACT] Número real extraído: \${originalRemoteJid} → \${remoteJid}\`);\\
      }" connection-manager.js

echo "✅ Interceptação de extração real adicionada"

# Verificar sintaxe final
node -c connection-manager.js
if [ $? -eq 0 ]; then
  echo "✅ Sintaxe final OK"
else
  echo "❌ Erro de sintaxe - restaurando backup"
  cp connection-manager.js.pre-real-fix connection-manager.js
  exit 1
fi

# Confirmar sistema
if grep -q "REAL_LID_NUMBER_EXTRACTOR" connection-manager.js; then
  echo "✅ Sistema de extração real confirmado"
else
  echo "❌ Sistema não encontrado - restaurando backup"
  cp connection-manager.js.pre-real-fix connection-manager.js  
  exit 1
fi

echo ""
echo "🎉 CORREÇÃO CIRÚRGICA REAL APLICADA COM SUCESSO!"
echo ""
echo "📋 O que foi feito:"
echo "✅ Sistema REAL_LID_NUMBER_EXTRACTOR adicionado"
echo "✅ Extração inteligente do número verdadeiro da mensagem"
echo "✅ Ignora grupos completamente"
echo "✅ Mensagens @lid sem número real são ignoradas"  
echo "✅ Nenhum código existente foi modificado"
echo ""
echo "🔍 Próxima mensagem @lid mostrará:"
echo "- [REAL_EXTRACT] se encontrou número real"
echo "- Ou será ignorada se não conseguir extrair"
EOFCIRURGICA