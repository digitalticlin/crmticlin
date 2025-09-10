// 🔍 TESTE PARA IDENTIFICAR CORRUPÇÃO DE NÚMEROS
// Simular exatamente o que acontece no sistema

console.log('🔍 ANÁLISE DO PADRÃO DE CORRUPÇÃO:');

// Dados conhecidos
const realNumber = '556281242215';
const corruptNumber = '107223925702810';

console.log(`   Número real:      ${realNumber} (length: ${realNumber.length})`);
console.log(`   Número corrompido: ${corruptNumber} (length: ${corruptNumber.length})`);
console.log(`   Diferença length:  ${corruptNumber.length - realNumber.length}`);
console.log('');

// Simular cleanPhoneNumber do connection-manager
function cleanPhoneNumber(jid) {
  if (!jid || typeof jid !== 'string') return jid;
  const phoneOnly = jid.split('@')[0];
  console.log(`🔧 Limpeza: ${jid} → ${phoneOnly}`);
  return phoneOnly;
}

// Testes com diferentes formatos
console.log('📱 TESTES DE LIMPEZA:');
const testCases = [
  '556281242215@s.whatsapp.net',
  '5562812422115@s.whatsapp.net', 
  '107223925702810@s.whatsapp.net',
  '+5562812422115@s.whatsapp.net'
];

testCases.forEach(test => {
  console.log(`   Input:  ${test}`);
  const result = cleanPhoneNumber(test);
  console.log(`   Output: ${result}`);
  console.log('');
});

// Verificar overflow/underflow
console.log('🔢 VERIFICAÇÃO DE OVERFLOW:');
const maxSafeInt = Number.MAX_SAFE_INTEGER;
console.log(`   MAX_SAFE_INTEGER: ${maxSafeInt}`);
console.log(`   Real number:      ${realNumber} (safe: ${parseInt(realNumber) <= maxSafeInt})`);
console.log(`   Corrupt number:   ${corruptNumber} (safe: ${parseInt(corruptNumber) <= maxSafeInt})`);

// Verificar se há alguma manipulação matemática
console.log('');
console.log('📊 ANÁLISE MATEMÁTICA:');
console.log(`   Real as int:      ${parseInt(realNumber)}`);
console.log(`   Corrupt as int:   ${parseInt(corruptNumber)}`);
console.log(`   Diferença:        ${parseInt(corruptNumber) - parseInt(realNumber)}`);

// Verificar possível buffer overflow ou concatenação
console.log('');
console.log('🔗 ANÁLISE DE CONCATENAÇÃO:');
// Talvez esteja concatenando com timestamp ou outro número?
const possiblePrefix = corruptNumber.slice(0, -realNumber.length);
console.log(`   Possível prefixo: ${possiblePrefix}`);
console.log(`   Resto do número:  ${corruptNumber.slice(possiblePrefix.length)}`);

// Verificar se real number está dentro do corrupt number
const isRealInCorrupt = corruptNumber.includes(realNumber);
console.log(`   Real está em corrupt: ${isRealInCorrupt}`);

// Análise de dígitos
console.log('');
console.log('🎯 HIPÓTESES:');
console.log('   1. Concatenação com timestamp/id');
console.log('   2. Buffer overflow em alguma função');
console.log('   3. Erro na limpeza do JID');
console.log('   4. Problema na formatação brasileira (format_brazilian_phone)');
console.log('   5. Erro no webhook data parsing');