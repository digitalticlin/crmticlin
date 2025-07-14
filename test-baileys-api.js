const { Browsers } = require('@whiskeysockets/baileys');

console.log('=== TESTE API BAILEYS ===');
console.log('Browsers object keys:', Object.keys(Browsers));
console.log('Chrome function type:', typeof Browsers.chrome);

// Teste 1: Browsers.chrome()
try {
    const result1 = Browsers.chrome();
    console.log('✅ Browsers.chrome() =', result1);
} catch (e) {
    console.log('❌ Browsers.chrome() error:', e.message);
}

// Teste 2: Browsers.chrome('Chrome')
try {
    const result2 = Browsers.chrome('Chrome');
    console.log('✅ Browsers.chrome("Chrome") =', result2);
} catch (e) {
    console.log('❌ Browsers.chrome("Chrome") error:', e.message);
}

// Teste 3: Browsers.chrome('WhatsApp')
try {
    const result3 = Browsers.chrome('WhatsApp');
    console.log('✅ Browsers.chrome("WhatsApp") =', result3);
} catch (e) {
    console.log('❌ Browsers.chrome("WhatsApp") error:', e.message);
}

// Teste 4: Verificar se é array
try {
    const chromeArray = ['WhatsApp', 'Chrome', '4.0.0'];
    console.log('✅ Array manual =', chromeArray);
} catch (e) {
    console.log('❌ Array manual error:', e.message);
}

console.log('=== FIM TESTE ==='); 