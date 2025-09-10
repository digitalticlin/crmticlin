// 🧪 TESTE DIRETO - Edge Function para VPS Puppeteer
// Testando criação de sessão independente na VPS 31.97.163.57:3001

const SUPABASE_URL = 'https://rhjgagzstjzynvrakdyj.supabase.co';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/whatsapp_chat_import`;

async function testarCriacaoSessaoPuppeteer() {
  console.log('🧪 TESTANDO CRIAÇÃO DE SESSÃO PUPPETEER...\n');

  const payload = {
    action: 'import_via_puppeteer',
    instanceId: 'teste-puppeteer-direct',
    userValidation: {
      createdByUserId: 'user-test',
      instanceName: 'Teste Puppeteer Modal'
    }
  };

  console.log('📤 Enviando para Edge Function:', payload);
  console.log('🔗 URL:', EDGE_FUNCTION_URL);

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.SUPABASE_ANON_KEY || 'sua_chave_aqui'
      },
      body: JSON.stringify(payload)
    });

    console.log('\n📊 RESPOSTA DA EDGE FUNCTION:');
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Data:', JSON.stringify(data, null, 2));

    if (data.success && data.qrCode) {
      console.log('\n✅ QR CODE GERADO COM SUCESSO!');
      console.log('Session ID:', data.sessionId);
      console.log('QR Code Length:', data.qrCode.length);
      console.log('Status:', data.status);
    } else {
      console.log('\n❌ FALHA NA GERAÇÃO DO QR CODE');
      console.log('Erro:', data.error);
    }

  } catch (error) {
    console.error('\n💥 ERRO NA REQUISIÇÃO:', error.message);
  }
}

// Executar teste
testarCriacaoSessaoPuppeteer().catch(console.error); 