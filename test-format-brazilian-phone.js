// 🔍 SIMULAR FUNÇÃO format_brazilian_phone DO SUPABASE
// Reproduzir exatamente a lógica PostgreSQL em JavaScript

function format_brazilian_phone(input_phone) {
  console.log(`📞 Input: ${input_phone}`);
  
  // Limpar apenas números
  let clean_phone = input_phone.replace(/[^0-9]/g, '');
  console.log(`🧹 Após limpeza: ${clean_phone}`);
  
  // Se começar com 55 (código do Brasil), manter
  if (clean_phone.match(/^55/)) {
    console.log(`🇧🇷 Já tem código 55, mantendo: ${clean_phone}`);
  } else if (clean_phone.length >= 10) {
    // Se não tem 55, adicionar
    console.log(`➕ Adicionando código 55: ${clean_phone} -> 55${clean_phone}`);
    clean_phone = '55' + clean_phone;
  } else {
    // Número muito curto, retornar original
    console.log(`⚠️ Número muito curto, retornando original: ${input_phone}`);
    return {
      phone: input_phone,
      display: input_phone
    };
  }
  
  console.log(`📏 Comprimento final: ${clean_phone.length}`);
  
  // Validar comprimento (deve ter 13 dígitos: 55 + DDD + número)
  if (clean_phone.length === 13) {
    // Formato: 556299212484 -> phone: '556299212484', display: '+55 (62) 9921-2484'
    const area_code = clean_phone.substring(2, 4);  // DDD
    const number_part = clean_phone.substring(4);   // Número completo
    
    console.log(`📱 13 dígitos - DDD: ${area_code}, Número: ${number_part}`);
    
    // Formatar display: +55 (62) 9921-2484
    const formatted_display = `+55 (${area_code}) ${number_part.substring(0, 1)}${number_part.substring(1, 4)}-${number_part.substring(4)}`;
    
    return {
      phone: clean_phone,
      display: formatted_display
    };
    
  } else if (clean_phone.length === 12) {
    // Formato antigo: 556299212484 -> phone: '556299212484', display: '+55 (62) 9921-2484'
    const area_code = clean_phone.substring(2, 4);
    const number_part = clean_phone.substring(4);
    
    console.log(`📱 12 dígitos - DDD: ${area_code}, Número: ${number_part}`);
    
    // Formatar display: +55 (62) 9212-4848
    const formatted_display = `+55 (${area_code}) ${number_part.substring(0, 4)}-${number_part.substring(4)}`;
    
    return {
      phone: clean_phone,
      display: formatted_display
    };
  } else {
    // Comprimento inválido, retornar original
    console.log(`❌ Comprimento inválido (${clean_phone.length}), retornando original: ${input_phone}`);
    return {
      phone: input_phone,
      display: input_phone
    };
  }
}

console.log('🧪 TESTE DA FUNÇÃO format_brazilian_phone:');
console.log('===========================================');

// Testar com o número real que está sendo corrompido
console.log('\n1️⃣ TESTE COM NÚMERO REAL (formatado):');
console.log('----------------------------------');
const result1 = format_brazilian_phone('556281242215');
console.log(`📊 Resultado:`, result1);

console.log('\n2️⃣ TESTE COM NÚMERO LIMPO (já processado):');
console.log('------------------------------------------');
const result2 = format_brazilian_phone('6281242215');
console.log(`📊 Resultado:`, result2);

console.log('\n3️⃣ TESTE COM NÚMERO CORROMPIDO:');
console.log('------------------------------');
const result3 = format_brazilian_phone('107223925702810');
console.log(`📊 Resultado:`, result3);

console.log('\n4️⃣ TESTE COM NÚMERO ORIGINAL QUE PODE ESTAR VINDO DA VPS:');
console.log('--------------------------------------------------------');
const result4 = format_brazilian_phone('6281242215@s.whatsapp.net');
console.log(`📊 Resultado:`, result4);

console.log('\n🎯 HIPÓTESE: O número pode estar chegando já corrompido na VPS');
console.log('===========================================================');
console.log('✅ A função format_brazilian_phone parece correta');
console.log('❌ O problema deve estar ANTES dela - na captura da mensagem ou limpeza do JID');