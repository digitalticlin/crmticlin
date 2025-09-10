const { Browsers } = require('@whiskeysockets/baileys');

console.log('=== TESTE BROWSERS ===');

try {
    console.log('ubuntu:', Browsers.ubuntu());
} catch (e) {
    console.log('ubuntu error:', e.message);
}

try {
    console.log('macOS:', Browsers.macOS());
} catch (e) {
    console.log('macOS error:', e.message);
}

try {
    console.log('baileys:', Browsers.baileys());
} catch (e) {
    console.log('baileys error:', e.message);
}

try {
    console.log('windows:', Browsers.windows());
} catch (e) {
    console.log('windows error:', e.message);
}

try {
    console.log('appropriate:', Browsers.appropriate());
} catch (e) {
    console.log('appropriate error:', e.message);
} 