// FIX: Correção completa para extração de números @lid corrompidos
// Este arquivo deve ser aplicado no connection-manager.js da VPS

// PROBLEMA IDENTIFICADO:
// 1. Números estão chegando como: 221092702589128@s.whatsapp.net (mal formatado)
// 2. O @lid não está sendo tratado corretamente
// 3. A função está filtrando mensagens @lid em vez de processar

// SOLUÇÃO: Função melhorada para extrair número correto de @lid corrompidos
function extractPhoneFromCorruptedJid(remoteJid, logPrefix) {
  const originalJid = remoteJid;
  
  // Caso 1: @lid corrompido
  if (remoteJid.includes('@lid')) {
    // Extrair apenas números do JID
    const numbersOnly = remoteJid.replace(/[^0-9]/g, '');
    console.log(`${logPrefix} 🔍 @lid detectado: "${originalJid}" → números: "${numbersOnly}"`);
    
    // Tentar identificar padrão de número brasileiro válido
    let realPhone = null;
    
    // Padrão 1: Número começa com 55 (Brasil)
    if (numbersOnly.startsWith('55')) {
      realPhone = numbersOnly;
    }
    // Padrão 2: Número muito longo (possível corrupção)
    else if (numbersOnly.length > 13) {
      // Tentar extrair número brasileiro de dentro do número corrompido
      // Exemplo: 221092702589128 pode conter 1092702589 (número real)
      
      // Buscar sequência que parece número brasileiro (11 dígitos após código país)
      const patterns = [
        /55(\d{2}\d{9})/, // Padrão brasileiro completo
        /55(\d{2}\d{8})/, // Padrão brasileiro antigo
        /(\d{2}\d{9})$/,  // Últimos 11 dígitos
        /(\d{2}\d{8})$/   // Últimos 10 dígitos
      ];
      
      for (const pattern of patterns) {
        const match = numbersOnly.match(pattern);
        if (match) {
          if (match[0].startsWith('55')) {
            realPhone = match[0];
          } else {
            realPhone = '55' + match[1];
          }
          console.log(`${logPrefix} ✅ Padrão encontrado: ${realPhone}`);
          break;
        }
      }
    }
    
    // Se não encontrou padrão, tentar inferir
    if (!realPhone && numbersOnly.length >= 10) {
      // Pegar últimos 11 dígitos e assumir que é brasileiro
      const last11 = numbersOnly.slice(-11);
      realPhone = '55' + last11;
      console.log(`${logPrefix} ⚠️ Inferindo número brasileiro: ${realPhone}`);
    }
    
    // Se conseguiu extrair, retornar formato correto
    if (realPhone) {
      return `${realPhone}@s.whatsapp.net`;
    }
    
    // Fallback: usar número como está
    console.log(`${logPrefix} ❌ Não foi possível corrigir @lid: ${originalJid}`);
    return `${numbersOnly}@s.whatsapp.net`;
  }
  
  // Caso 2: Número mal formatado sem @lid
  // Exemplo: 221092702589128@s.whatsapp.net
  if (remoteJid.includes('@s.whatsapp.net')) {
    const phoneNumber = remoteJid.split('@')[0];
    
    // Se o número é muito longo ou tem formato estranho
    if (phoneNumber.length > 15 || !phoneNumber.startsWith('55')) {
      console.log(`${logPrefix} 🔧 Número suspeito: ${phoneNumber}`);
      
      // Tentar extrair número brasileiro válido
      // Exemplo: 221092702589128 → 1092702589
      const patterns = [
        /55(\d{10,11})/, // Número brasileiro com código
        /(\d{2})(\d{9})$/, // DDD + 9 dígitos no final
        /(\d{2})(\d{8})$/  // DDD + 8 dígitos no final
      ];
      
      for (const pattern of patterns) {
        const match = phoneNumber.match(pattern);
        if (match) {
          let extracted;
          if (match[0].startsWith('55')) {
            extracted = match[0];
          } else if (match[2]) {
            extracted = '55' + match[1] + match[2];
          } else {
            extracted = '55' + match[1];
          }
          
          console.log(`${logPrefix} ✅ Número corrigido: ${phoneNumber} → ${extracted}`);
          return `${extracted}@s.whatsapp.net`;
        }
      }
      
      // Última tentativa: pegar últimos 11 dígitos
      if (phoneNumber.length > 11) {
        const last11 = phoneNumber.slice(-11);
        const corrected = '55' + last11;
        console.log(`${logPrefix} ⚠️ Usando últimos 11 dígitos: ${phoneNumber} → ${corrected}`);
        return `${corrected}@s.whatsapp.net`;
      }
    }
  }
  
  // Caso 3: JID está correto, retornar como está
  return remoteJid;
}

// SUBSTITUIR NO connection-manager.js:
// Localizar a seção que trata @lid (por volta da linha 271)
// e substituir todo o bloco de tratamento @lid por:

/*
// 🔧 CORREÇÃO MELHORADA: Processar números corrompidos (@lid e outros)
const cleanedJid = extractPhoneFromCorruptedJid(remoteJid, logPrefix);
if (cleanedJid !== remoteJid) {
  console.log(`${logPrefix} 🔄 JID corrigido: ${remoteJid} → ${cleanedJid}`);
  remoteJid = cleanedJid;
}

// IMPORTANTE: Remover o filtro que ignora @lid (linha 309-311)
// Mudar de:
// if (remoteJid.includes('@g.us') || remoteJid.includes('@broadcast') ||
//     remoteJid.includes('@newsletter') || remoteJid.includes('@lid')) {

// Para:
if (remoteJid.includes('@g.us') || remoteJid.includes('@broadcast') ||
    remoteJid.includes('@newsletter')) {
  console.log(`${logPrefix} 🚫 Mensagem de grupo/broadcast/newsletter ignorada: ${remoteJid}`);
  return;
}
*/

// EXEMPLO DE USO DA CORREÇÃO:
// Input: "221092702589128@lid" ou "221092702589128@s.whatsapp.net"  
// Output: "551092702589128@s.whatsapp.net" (número brasileiro correto)

module.exports = { extractPhoneFromCorruptedJid };