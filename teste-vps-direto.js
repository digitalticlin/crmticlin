// 🧪 TESTE DIRETO VPS PUPPETEER
// Testando diretamente na VPS 31.97.163.57:3001

const VPS_URL = 'http://31.97.163.57:3001';
const TOKEN = '8bb0c4f8a89d254783d693050ecd7ff4878534f46a87ece12b24f506548ce430';

async function testarVPSPuppeteer() {
  console.log('🧪 TESTANDO VPS PUPPETEER DIRETAMENTE...\n');

  const payload = {
    instanceId: 'teste-direto-js',
    instanceName: 'Teste Direto JS',
    webhookUrl: 'https://example.com/webhook'
  };

  console.log('📤 URL:', VPS_URL + '/start-import');
  console.log('📤 Token:', TOKEN.substring(0, 10) + '...');
  console.log('📤 Payload:', payload);

  try {
    const response = await fetch(VPS_URL + '/start-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    console.log('\n📊 RESPOSTA DA VPS:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('Data:', JSON.stringify(data, null, 2));
      
      if (data.qrCode) {
        console.log('\n✅ QR CODE GERADO!');
        console.log('Session ID:', data.sessionId);
        console.log('QR Length:', data.qrCode.length);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erro Response:', errorText);
    }

  } catch (error) {
    console.error('\n💥 ERRO:', error.message);
  }
}

testarVPSPuppeteer().catch(console.error); 