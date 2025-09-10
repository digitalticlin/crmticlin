const baileys = require('@whiskeysockets/baileys');
console.log('Todas as funções:', Object.keys(baileys));
console.log('Funções com browser:', Object.keys(baileys).filter(k => k.toLowerCase().includes('browser')));
console.log('Testando Browsers:', typeof baileys.Browsers); 