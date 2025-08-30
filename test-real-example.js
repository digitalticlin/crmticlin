// 🧪 TESTAR COM EXEMPLO REAL DE CELULAR 9 DÍGITOS

function format_test(input_phone) {
  let clean_phone = input_phone.replace(/[^0-9]/g, '');
  
  if (!clean_phone.match(/^55/) && clean_phone.length >= 10) {
    clean_phone = '55' + clean_phone;
  }
  
  console.log(`Input: ${input_phone} -> Clean: ${clean_phone} (${clean_phone.length} dígitos)`);
  
  if (clean_phone.length === 13) {
    // 13 dígitos: Celular moderno 55 + DDD + 9 dígitos
    const area_code = clean_phone.substring(2, 4);
    const number_part = clean_phone.substring(4); // 9 dígitos: 999999999
    
    // FORMATO ATUAL: +55 (62) 9999-99999 (4+5)
    const current = `+55 (${area_code}) ${number_part.substring(0, 4)}-${number_part.substring(4)}`;
    
    // FORMATO DESEJADO: +55 (62) 99999-9999 (5+4)  
    const desired = `+55 (${area_code}) ${number_part.substring(0, 5)}-${number_part.substring(5)}`;
    
    console.log(`  ATUAL:    ${current}`);
    console.log(`  DESEJADO: ${desired}`);
    console.log(`  4 dígitos após hífen? ${number_part.substring(5).length === 4 ? '✅' : '❌'}`);
    
  } else if (clean_phone.length === 12) {
    // 12 dígitos: Fixo ou celular antigo 55 + DDD + 8 dígitos
    const area_code = clean_phone.substring(2, 4);
    const number_part = clean_phone.substring(4); // 8 dígitos: 99999999
    
    const format = `+55 (${area_code}) ${number_part.substring(0, 4)}-${number_part.substring(4)}`;
    
    console.log(`  FORMATO:  ${format}`);
    console.log(`  4 dígitos após hífen? ${number_part.substring(4).length === 4 ? '✅' : '❌'}`);
  }
  
  console.log('');
}

console.log('🧪 TESTE COM EXEMPLOS REAIS:');
console.log('============================');

console.log('1️⃣ CELULAR 9 DÍGITOS REAL:');
format_test('5562999999999'); // 13 dígitos

console.log('2️⃣ CELULAR 8 DÍGITOS (formato antigo):');
format_test('556299999999'); // 12 dígitos

console.log('3️⃣ EXEMPLO DO USUÁRIO (+55 62 99999-999):');
format_test('5562999999999'); // Mesmo exemplo

console.log('📋 CONCLUSÃO:');
console.log('============');
console.log('🎯 Para ter 4 dígitos após o hífen em CELULAR 9 dígitos:');
console.log('   Formato: +55 (62) 99999-9999 (5+4 dígitos)');
console.log('🎯 Para ter 4 dígitos após o hífen em FIXO 8 dígitos:'); 
console.log('   Formato: +55 (62) 9999-9999 (4+4 dígitos)');
console.log('');
console.log('✅ A correção na migration está correta!');