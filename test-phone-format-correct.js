// 🧪 CORREÇÃO: TESTAR FORMATAÇÃO CORRETA PARA 4 DÍGITOS APÓS HÍFEN

function format_brazilian_phone_FIXED(input_phone) {
  console.log(`📞 Input: ${input_phone}`);
  
  let clean_phone = input_phone.replace(/[^0-9]/g, '');
  console.log(`🧹 Após limpeza: ${clean_phone}`);
  
  if (clean_phone.match(/^55/)) {
    console.log(`🇧🇷 Já tem código 55, mantendo: ${clean_phone}`);
  } else if (clean_phone.length >= 10) {
    console.log(`➕ Adicionando código 55: ${clean_phone} -> 55${clean_phone}`);
    clean_phone = '55' + clean_phone;
  } else {
    return { phone: input_phone, display: input_phone };
  }
  
  console.log(`📏 Comprimento final: ${clean_phone.length}`);
  
  let area_code, number_part, formatted_display;
  
  if (clean_phone.length === 13) {
    // 13 dígitos: 55 + DDD + 9 dígitos (celular moderno com 9)
    area_code = clean_phone.substring(2, 4);
    number_part = clean_phone.substring(4); // 9 dígitos
    
    console.log(`📱 13 dígitos - DDD: ${area_code}, Número: ${number_part} (${number_part.length} dígitos)`);
    
    // 🔧 CELULAR: +55 (62) 99999-9999 (5 + 4 dígitos)
    formatted_display = `+55 (${area_code}) ${number_part.substring(0, 5)}-${number_part.substring(5)}`;
    console.log(`🔧 CELULAR: "${number_part.substring(0, 5)}-${number_part.substring(5)}"`);
    
  } else if (clean_phone.length === 12) {
    // 12 dígitos: 55 + DDD + 8 dígitos (fixo ou celular antigo)
    area_code = clean_phone.substring(2, 4);
    number_part = clean_phone.substring(4); // 8 dígitos
    
    console.log(`📱 12 dígitos - DDD: ${area_code}, Número: ${number_part} (${number_part.length} dígitos)`);
    
    // 🔧 FIXO/ANTIGO: +55 (62) 9999-9999 (4 + 4 dígitos)
    formatted_display = `+55 (${area_code}) ${number_part.substring(0, 4)}-${number_part.substring(4)}`;
    console.log(`🔧 FIXO: "${number_part.substring(0, 4)}-${number_part.substring(4)}"`);
    
  } else if (clean_phone.length === 11) {
    // 11 dígitos: 55 + DDD + 7 dígitos (número fixo sem o 9)
    area_code = clean_phone.substring(2, 4);
    number_part = clean_phone.substring(4); // 7 dígitos
    
    console.log(`📱 11 dígitos - DDD: ${area_code}, Número: ${number_part} (${number_part.length} dígitos)`);
    
    // 🔧 FIXO SEM 9: +55 (62) 999-9999 (3 + 4 dígitos)
    formatted_display = `+55 (${area_code}) ${number_part.substring(0, 3)}-${number_part.substring(3)}`;
    console.log(`🔧 FIXO SEM 9: "${number_part.substring(0, 3)}-${number_part.substring(3)}"`);
    
  } else {
    return { phone: input_phone, display: input_phone };
  }
  
  return {
    phone: clean_phone,
    display: formatted_display
  };
}

console.log('🧪 TESTE FORMATAÇÃO CORRETA:');
console.log('============================');

console.log('\n1️⃣ CELULAR 9 DÍGITOS (556299212484):');
const result1 = format_brazilian_phone_FIXED('556299212484');
console.log(`📊 ${result1.display}`);

console.log('\n2️⃣ CELULAR SEM 55 (6299212484):');
const result2 = format_brazilian_phone_FIXED('6299212484');
console.log(`📊 ${result2.display}`);

console.log('\n3️⃣ FIXO COM 8 DÍGITOS (556232128484):');
const result3 = format_brazilian_phone_FIXED('556232128484');
console.log(`📊 ${result3.display}`);

console.log('\n4️⃣ FIXO REAL 7 DÍGITOS (55623212848):');
const result4 = format_brazilian_phone_FIXED('55623212848');
console.log(`📊 ${result4.display}`);

console.log('\n✅ TODOS AGORA TÊM 4 DÍGITOS APÓS O HÍFEN!');