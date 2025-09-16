// CORREÇÃO ESPECÍFICA PARA @LID EM MENSAGENS DIRETAS
// Problema: remoteJid vem como @lid, precisa encontrar o número real na estrutura da mensagem

function createDirectLidFix() {
  return `
// ============================================================================
// 🔧 DIRECT LID EXTRACTOR - APENAS PARA MENSAGENS DIRETAS (NÃO GRUPOS)
// ============================================================================
const DIRECT_LID_EXTRACTOR = {
  
  // Extrai número real de mensagens diretas com @lid
  extractRealFromDirectMessage: function(message, remoteJid, logPrefix = '') {
    // Verificação 1: Ignorar grupos completamente
    if (remoteJid && (remoteJid.includes('@g.us') || remoteJid.includes('@broadcast'))) {
      console.log(\`\${logPrefix} 🚫 [DIRECT_LID] Mensagem de grupo ignorada: \${remoteJid}\`);
      return null; // Retorna null para ignorar grupo
    }
    
    // Verificação 2: Se não é @lid, retorna original
    if (!remoteJid || !remoteJid.includes('@lid')) {
      return remoteJid;
    }
    
    const originalJid = remoteJid;
    const corruptedNumber = remoteJid.replace('@lid', '');
    
    console.log(\`\${logPrefix} 🔍 [DIRECT_LID] MENSAGEM DIRETA com @lid: "\${originalJid}"\`);
    console.log(\`\${logPrefix} 🔍 [DIRECT_LID] Número corrompido: "\${corruptedNumber}"\`);
    
    // ESTRATÉGIA PRINCIPAL: Buscar número real nos campos da mensagem
    let realNumber = null;
    
    // Campo 1: Verificar se há verifiedName (pode conter número real)
    if (message.verifiedName) {
      console.log(\`\${logPrefix} 📱 [DIRECT_LID] verifiedName: "\${message.verifiedName}"\`);
      
      // Se verifiedName contém número válido
      const phonePattern = /55\d{10,11}/;
      const match = message.verifiedName.match(phonePattern);
      if (match) {
        realNumber = match[0] + '@s.whatsapp.net';
        console.log(\`\${logPrefix} ✅ [DIRECT_LID] Número extraído de verifiedName: \${realNumber}\`);
      }
    }
    
    // Campo 2: Verificar pushName se contém identificação de número
    if (!realNumber && message.pushName) {
      console.log(\`\${logPrefix} 📝 [DIRECT_LID] pushName: "\${message.pushName}"\`);
      
      // Extrair qualquer sequência que pareça com número brasileiro
      const phonePattern = /(\d{10,13})/g;
      const matches = message.pushName.match(phonePattern);
      
      if (matches) {
        for (const match of matches) {
          if (match.length >= 10) {
            let phoneNumber = match;
            
            // Adicionar código do país se necessário
            if (!phoneNumber.startsWith('55')) {
              phoneNumber = '55' + phoneNumber;
            }
            
            // Validar se parece com número brasileiro
            if (phoneNumber.match(/^55\d{2}\d{8,9}$/)) {
              realNumber = phoneNumber + '@s.whatsapp.net';
              console.log(\`\${logPrefix} ✅ [DIRECT_LID] Número extraído de pushName: \${realNumber}\`);
              break;
            }
          }
        }
      }
    }
    
    // Campo 3: Buscar em outros campos da mensagem
    if (!realNumber) {
      // Verificar se há algum campo que contenha o número real
      const messageStr = JSON.stringify(message);
      const phonePattern = /55\d{10,11}/g;
      const matches = messageStr.match(phonePattern);
      
      if (matches && matches.length > 0) {
        // Pegar primeiro número brasileiro válido encontrado
        const validNumber = matches[0];
        realNumber = validNumber + '@s.whatsapp.net';
        console.log(\`\${logPrefix} 💡 [DIRECT_LID] Número encontrado na estrutura: \${realNumber}\`);
      }
    }
    
    // ÚLTIMA ESTRATÉGIA: Tentar reconstruir número baseado em padrões conhecidos
    if (!realNumber) {
      console.log(\`\${logPrefix} 🧮 [DIRECT_LID] Tentando reconstruir número de: "\${corruptedNumber}"\`);
      
      // Casos específicos baseados nos logs:
      // 45329235878097 - pode ser resultado de alguma operação
      
      if (corruptedNumber.length > 11) {
        // Estratégia: pegar últimos 11 dígitos se formam um DDD brasileiro válido
        const last11 = corruptedNumber.slice(-11);
        const ddd = last11.substring(0, 2);
        
        // DDDs brasileiros válidos (11-99)
        const validDDDs = /^(1[1-9]|[2-9]\d)$/;
        
        if (validDDDs.test(ddd)) {
          realNumber = '55' + last11 + '@s.whatsapp.net';
          console.log(\`\${logPrefix} 💡 [DIRECT_LID] Número reconstruído: \${realNumber}\`);
        }
      }
    }
    
    if (realNumber) {
      console.log(\`\${logPrefix} ✅ [DIRECT_LID] SUCESSO - NÚMERO REAL ENCONTRADO:\`);
      console.log(\`\${logPrefix} ✅ [DIRECT_LID] Original @lid: \${originalJid}\`);
      console.log(\`\${logPrefix} ✅ [DIRECT_LID] Número real: \${realNumber}\`);
      return realNumber;
    }
    
    // Se não conseguiu encontrar, fazer log detalhado para análise
    console.log(\`\${logPrefix} 🚨 [DIRECT_LID] FALHA - NÃO ENCONTROU NÚMERO REAL\`);
    console.log(\`\${logPrefix} 🚨 [DIRECT_LID] @lid corrompido: \${originalJid}\`);
    console.log(\`\${logPrefix} 🚨 [DIRECT_LID] Campos analisados:\`);
    console.log(\`\${logPrefix} 🚨 [DIRECT_LID] - verifiedName: \${message.verifiedName || 'N/A'}\`);
    console.log(\`\${logPrefix} 🚨 [DIRECT_LID] - pushName: \${message.pushName || 'N/A'}\`);
    console.log(\`\${logPrefix} 🚨 [DIRECT_LID] - messageTimestamp: \${message.messageTimestamp || 'N/A'}\`);
    
    // IMPORTANTE: Se não conseguiu extrair, pode ser melhor REJEITAR a mensagem
    // em vez de processar com número errado
    console.log(\`\${logPrefix} ⚠️ [DIRECT_LID] CONSIDERANDO REJEITAR MENSAGEM com @lid não resolvido\`);
    
    // Por enquanto, retorna null para indicar que não deve processar
    return null; // Não processar mensagem com @lid não resolvido
  }
};

// ============================================================================
// FIM DIRECT LID EXTRACTOR
// ============================================================================
`;
}

// IMPLEMENTAÇÃO NO CONNECTION-MANAGER.JS:
/*
// Substituir:
let remoteJid = message.key.remoteJid;

// Por:
let remoteJid = message.key.remoteJid;

// 🔧 EXTRAÇÃO REAL PARA MENSAGENS DIRETAS COM @LID
if (remoteJid && remoteJid.includes('@lid')) {
  const extractedJid = DIRECT_LID_EXTRACTOR.extractRealFromDirectMessage(message, remoteJid, logPrefix);
  
  if (extractedJid === null) {
    // Mensagem @lid não pôde ser resolvida - IGNORAR
    console.log(\`\${logPrefix} 🚫 [DIRECT_LID] Mensagem @lid ignorada - não foi possível extrair número real\`);
    return; // Sair da função, não processar esta mensagem
  } else {
    remoteJid = extractedJid;
    console.log(\`\${logPrefix} ✅ [DIRECT_LID] RemoteJid corrigido: \${remoteJid}\`);
  }
}
*/

module.exports = { createDirectLidFix };