// CORREÇÃO REAL PARA @LID - EXTRAÇÃO DO NÚMERO VERDADEIRO
// Este é o problema real: extrair número correto da mensagem, não mapear estaticamente

function createRealLidExtractor() {
  return `
// ============================================================================
// 🔧 REAL LID EXTRACTOR - EXTRAI NÚMERO VERDADEIRO DA MENSAGEM
// ============================================================================
const REAL_LID_EXTRACTOR = {
  
  // Extrai o número real quando há @lid corrompido
  extractRealNumber: function(message, remoteJid, logPrefix = '') {
    if (!remoteJid || !remoteJid.includes('@lid')) {
      return remoteJid; // Não é @lid, retorna original
    }
    
    const originalJid = remoteJid;
    const corruptedNumber = remoteJid.replace('@lid', '');
    
    console.log(\`\${logPrefix} 🔍 [REAL_LID] @lid detectado: "\${originalJid}"\`);
    console.log(\`\${logPrefix} 🔍 [REAL_LID] Número corrompido: "\${corruptedNumber}"\`);
    
    // ESTRATÉGIA 1: Verificar se há participant (em grupos)
    let realNumber = null;
    
    if (message.key && message.key.participant) {
      const participant = message.key.participant;
      console.log(\`\${logPrefix} 📱 [REAL_LID] Participant encontrado: "\${participant}"\`);
      
      // Se participant é um número válido
      if (participant.includes('@s.whatsapp.net') && !participant.includes('@lid')) {
        realNumber = participant;
        console.log(\`\${logPrefix} ✅ [REAL_LID] Número extraído do participant: \${realNumber}\`);
      } else if (participant.includes('@lid')) {
        // Participant também está corrompido, continuar estratégias
        console.log(\`\${logPrefix} ⚠️ [REAL_LID] Participant também corrompido: \${participant}\`);
      }
    }
    
    // ESTRATÉGIA 2: Verificar pushName se contém número
    if (!realNumber && message.pushName) {
      const pushName = message.pushName;
      console.log(\`\${logPrefix} 📝 [REAL_LID] PushName: "\${pushName}"\`);
      
      // Extrair número do pushName se parecer com telefone
      const phonePattern = /(\d{10,15})/;
      const match = pushName.match(phonePattern);
      if (match) {
        let extracted = match[1];
        if (!extracted.startsWith('55')) {
          extracted = '55' + extracted;
        }
        realNumber = extracted + '@s.whatsapp.net';
        console.log(\`\${logPrefix} 📱 [REAL_LID] Número extraído do pushName: \${realNumber}\`);
      }
    }
    
    // ESTRATÉGIA 3: Verificar messageTimestamp + user patterns
    if (!realNumber && message.messageTimestamp) {
      console.log(\`\${logPrefix} ⏰ [REAL_LID] Timestamp: \${message.messageTimestamp}\`);
      
      // Aqui poderíamos implementar lógica baseada em timestamp
      // Por exemplo, buscar no banco mensagens recentes do mesmo usuário
    }
    
    // ESTRATÉGIA 4: Análise do número corrompido para inferir padrão
    if (!realNumber) {
      console.log(\`\${logPrefix} 🧮 [REAL_LID] Tentando inferir padrão do número corrompido...\`);
      
      // Padrões comuns encontrados:
      // 45329235878097 pode ser resultado de alguma operação matemática ou concatenação
      
      // Tentar encontrar padrão brasileiro (11 dígitos após código país)
      if (corruptedNumber.length > 13) {
        // Tentar extrair últimos 11 dígitos como número brasileiro
        const last11 = corruptedNumber.slice(-11);
        if (last11.match(/^\d{2}\d{9}$/)) { // DDD + 9 dígitos
          realNumber = '55' + last11 + '@s.whatsapp.net';
          console.log(\`\${logPrefix} 💡 [REAL_LID] Padrão inferido (últimos 11): \${realNumber}\`);
        }
      }
    }
    
    if (realNumber) {
      console.log(\`\${logPrefix} ✅ [REAL_LID] NÚMERO REAL ENCONTRADO:\`);
      console.log(\`\${logPrefix} ✅ [REAL_LID] Corrompido: \${originalJid}\`);
      console.log(\`\${logPrefix} ✅ [REAL_LID] Real: \${realNumber}\`);
      return realNumber;
    }
    
    // Se não conseguiu extrair, logar para análise manual
    console.log(\`\${logPrefix} 🚨 [REAL_LID] NÃO FOI POSSÍVEL EXTRAIR NÚMERO REAL\`);
    console.log(\`\${logPrefix} 🚨 [REAL_LID] Estrutura da mensagem:\`);
    console.log(\`\${logPrefix} 🚨 [REAL_LID] - remoteJid: \${originalJid}\`);
    console.log(\`\${logPrefix} 🚨 [REAL_LID] - participant: \${message.key?.participant || 'N/A'}\`);
    console.log(\`\${logPrefix} 🚨 [REAL_LID] - pushName: \${message.pushName || 'N/A'}\`);
    console.log(\`\${logPrefix} 🚨 [REAL_LID] - messageTimestamp: \${message.messageTimestamp || 'N/A'}\`);
    
    // Retornar original para não quebrar (temporário)
    return originalJid;
  },
  
  // Log estrutura completa da mensagem para análise
  debugMessageStructure: function(message, logPrefix = '') {
    if (!message) return;
    
    console.log(\`\${logPrefix} 📋 [DEBUG_LID] ESTRUTURA DA MENSAGEM:\`);
    console.log(\`\${logPrefix} 📋 [DEBUG_LID] key.remoteJid: \${message.key?.remoteJid}\`);
    console.log(\`\${logPrefix} 📋 [DEBUG_LID] key.participant: \${message.key?.participant}\`);
    console.log(\`\${logPrefix} 📋 [DEBUG_LID] key.fromMe: \${message.key?.fromMe}\`);
    console.log(\`\${logPrefix} 📋 [DEBUG_LID] key.id: \${message.key?.id}\`);
    console.log(\`\${logPrefix} 📋 [DEBUG_LID] pushName: \${message.pushName}\`);
    console.log(\`\${logPrefix} 📋 [DEBUG_LID] messageTimestamp: \${message.messageTimestamp}\`);
    
    // Log campos específicos que podem conter o número real
    if (message.key?.participant?.includes('@lid')) {
      console.log(\`\${logPrefix} 🔍 [DEBUG_LID] PARTICIPANT TAMBÉM TEM @LID: \${message.key.participant}\`);
    }
    
    // Verificar se há outros campos úteis
    const keys = Object.keys(message);
    console.log(\`\${logPrefix} 📋 [DEBUG_LID] Campos disponíveis: \${keys.join(', ')}\`);
  }
};

// ============================================================================
// FIM REAL LID EXTRACTOR  
// ============================================================================
`;
}

// USO NO CONNECTION-MANAGER.JS:
// Substituir a linha atual:
// let remoteJid = message.key.remoteJid;
//
// Por:
// let remoteJid = message.key.remoteJid;
// // 🔧 EXTRAÇÃO REAL DO NÚMERO (não mapeamento)
// remoteJid = REAL_LID_EXTRACTOR.extractRealNumber(message, remoteJid, logPrefix);
// 
// // Debug completo se @lid
// if (message.key.remoteJid.includes('@lid')) {
//   REAL_LID_EXTRACTOR.debugMessageStructure(message, logPrefix);
// }

module.exports = { createRealLidExtractor };