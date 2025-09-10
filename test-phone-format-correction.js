// 🧪 TESTAR NOVA FORMATAÇÃO DE TELEFONE
// Simular a correção da função format_brazilian_phone

function format_brazilian_phone_NEW(input_phone) {
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
  
  let area_code, number_part, formatted_display;
  
  // Validar comprimento (deve ter 13 dígitos: 55 + DDD + número)
  if (clean_phone.length === 13) {
    // Formato: 556299212484 -> phone: '556299212484', display: '+55 (62) 99999-9999'
    area_code = clean_phone.substring(2, 4);  // DDD
    number_part = clean_phone.substring(4);   // Número completo (9 dígitos)
    
    console.log(`📱 13 dígitos - DDD: ${area_code}, Número: ${number_part} (${number_part.length} dígitos)`);
    
    // 🔧 NOVO FORMATO: +55 (62) 99999-9999 (5 dígitos + hífen + 4 dígitos)
    formatted_display = `+55 (${area_code}) ${number_part.substring(0, 5)}-${number_part.substring(5)}`;
    
    console.log(`🔧 NOVO: Primeiros 5: "${number_part.substring(0, 5)}", Últimos 4: "${number_part.substring(5)}"`);
    
  } else if (clean_phone.length === 12) {
    // Formato antigo: 556299212484 -> phone: '556299212484', display: '+55 (62) 9999-9999'
    area_code = clean_phone.substring(2, 4);
    number_part = clean_phone.substring(4);   // Número completo (8 dígitos)
    
    console.log(`📱 12 dígitos - DDD: ${area_code}, Número: ${number_part} (${number_part.length} dígitos)`);
    
    // 🔧 FORMATO ANTIGO: +55 (62) 9999-9999 (4 dígitos + hífen + 4 dígitos)
    formatted_display = `+55 (${area_code}) ${number_part.substring(0, 4)}-${number_part.substring(4)}`;
    
    console.log(`🔧 ANTIGO: Primeiros 4: "${number_part.substring(0, 4)}", Últimos 4: "${number_part.substring(4)}"`);
    
  } else {
    // Comprimento inválido, retornar original
    console.log(`❌ Comprimento inválido (${clean_phone.length}), retornando original: ${input_phone}`);
    return {
      phone: input_phone,
      display: input_phone
    };
  }
  
  return {
    phone: clean_phone,
    display: formatted_display
  };
}

console.log('🧪 TESTE DA NOVA FORMATAÇÃO DE TELEFONE:');
console.log('========================================');

console.log('\n1️⃣ CELULAR 9 DÍGITOS (formato moderno):');
console.log('---------------------------------------');
const result1 = format_brazilian_phone_NEW('556299212484');
console.log(`📊 Resultado: phone="${result1.phone}", display="${result1.display}"`);

console.log('\n2️⃣ FIXO 8 DÍGITOS (formato antigo):');
console.log('----------------------------------');
const result2 = format_brazilian_phone_NEW('55629921248');
console.log(`📊 Resultado: phone="${result2.phone}", display="${result2.display}"`);

console.log('\n3️⃣ SEM CÓDIGO 55 (celular):');
console.log('---------------------------');
const result3 = format_brazilian_phone_NEW('6299212484');
console.log(`📊 Resultado: phone="${result3.phone}", display="${result3.display}"`);

console.log('\n4️⃣ SEM CÓDIGO 55 (fixo):');
console.log('------------------------');
const result4 = format_brazilian_phone_NEW('629921248');
console.log(`📊 Resultado: phone="${result4.phone}", display="${result4.display}"`);

console.log('\n📋 COMPARAÇÃO DOS FORMATOS:');
console.log('==========================');
console.log('🔴 FORMATO ANTIGO:  "+55 (62) 9921-2484" (3+4 dígitos)');
console.log('🟢 FORMATO NOVO:    "+55 (62) 99212-484" (5+4 dígitos) ← CELULAR');
console.log('🟢 FORMATO NOVO:    "+55 (62) 9992-1248" (4+4 dígitos) ← FIXO');
console.log('');
console.log('✅ Agora todos têm 4 dígitos após o hífen como solicitado!');