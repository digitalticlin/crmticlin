// TESTE DE ACESSO SUPABASE - SERVICE ROLE vs ANON KEY
// Executa no browser console ou Node.js

const SUPABASE_URL = 'https://rhjgagzstjzynvrakdyj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.mPNiX4u-4tYEBzfpkl_cL_kgOhXEW-c6xKp-LNJMhLQ';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0._trCzQxDz5wCHs6NlrXRPAJNqfCRQM4s8NhkX5xEn4w';

async function testSupabaseAccess() {
  console.log('🧪 TESTE DE ACESSO SUPABASE');
  console.log('=' .repeat(50));

  const results = {
    service_role: {},
    anon_key: {}
  };

  // TESTE 1: SERVICE ROLE
  console.log('\n🔑 Testando SERVICE ROLE...');
  try {
    // Testar acesso à tabela leads
    const leadsResponse = await fetch(`${SUPABASE_URL}/rest/v1/leads?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    results.service_role.leads = {
      status: leadsResponse.status,
      ok: leadsResponse.ok,
      error: leadsResponse.ok ? null : await leadsResponse.text()
    };

    if (leadsResponse.ok) {
      const leadsData = await leadsResponse.json();
      results.service_role.leads.count = leadsData.length;
      console.log('✅ SERVICE ROLE - Acesso a leads: SUCESSO');
    } else {
      console.log('❌ SERVICE ROLE - Acesso a leads: FALHOU');
    }

    // Testar inserção em messages SEM lead_id
    const messagePayload = {
      whatsapp_number_id: '1c55e683-60ec-4a68-a672-fd2b28303e0e',
      text: `TESTE SERVICE ROLE ${Date.now()}`,
      from_me: false,
      timestamp: new Date().toISOString(),
      status: 'received',
      created_by_user_id: 'd6f35c23-1a93-4e67-8ad8-f94b3b52c8ae',
      media_type: 'text',
      import_source: 'test'
    };

    const messageResponse = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(messagePayload)
    });

    results.service_role.messages = {
      status: messageResponse.status,
      ok: messageResponse.ok,
      error: messageResponse.ok ? null : await messageResponse.text()
    };

    if (messageResponse.ok) {
      const messageData = await messageResponse.json();
      results.service_role.messages.inserted_id = messageData[0]?.id;
      console.log('✅ SERVICE ROLE - Inserção em messages: SUCESSO');
      
      // Deletar o teste
      if (messageData[0]?.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${messageData[0].id}`, {
          method: 'DELETE',
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
          }
        });
      }
    } else {
      console.log('❌ SERVICE ROLE - Inserção em messages: FALHOU');
    }

  } catch (error) {
    console.log('❌ SERVICE ROLE - Erro geral:', error.message);
    results.service_role.error = error.message;
  }

  // TESTE 2: ANON KEY
  console.log('\n🔑 Testando ANON KEY...');
  try {
    // Testar acesso à tabela leads
    const leadsResponse = await fetch(`${SUPABASE_URL}/rest/v1/leads?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    results.anon_key.leads = {
      status: leadsResponse.status,
      ok: leadsResponse.ok,
      error: leadsResponse.ok ? null : await leadsResponse.text()
    };

    if (leadsResponse.ok) {
      const leadsData = await leadsResponse.json();
      results.anon_key.leads.count = leadsData.length;
      console.log('✅ ANON KEY - Acesso a leads: SUCESSO');
    } else {
      console.log('❌ ANON KEY - Acesso a leads: FALHOU');
    }

    // Testar inserção em messages SEM lead_id
    const messagePayload = {
      whatsapp_number_id: '1c55e683-60ec-4a68-a672-fd2b28303e0e',
      text: `TESTE ANON KEY ${Date.now()}`,
      from_me: false,
      timestamp: new Date().toISOString(),
      status: 'received',
      created_by_user_id: 'd6f35c23-1a93-4e67-8ad8-f94b3b52c8ae',
      media_type: 'text',
      import_source: 'test'
    };

    const messageResponse = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(messagePayload)
    });

    results.anon_key.messages = {
      status: messageResponse.status,
      ok: messageResponse.ok,
      error: messageResponse.ok ? null : await messageResponse.text()
    };

    if (messageResponse.ok) {
      const messageData = await messageResponse.json();
      results.anon_key.messages.inserted_id = messageData[0]?.id;
      console.log('✅ ANON KEY - Inserção em messages: SUCESSO');
      
      // Deletar o teste
      if (messageData[0]?.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${messageData[0].id}`, {
          method: 'DELETE',
          headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`
          }
        });
      }
    } else {
      console.log('❌ ANON KEY - Inserção em messages: FALHOU');
    }

  } catch (error) {
    console.log('❌ ANON KEY - Erro geral:', error.message);
    results.anon_key.error = error.message;
  }

  // RESULTADOS FINAIS
  console.log('\n📊 RESULTADOS FINAIS:');
  console.log('=' .repeat(50));
  console.log(JSON.stringify(results, null, 2));

  return results;
}

// Executar o teste
testSupabaseAccess().catch(console.error);

// Para usar no browser:
// 1. Abra o console do navegador (F12)
// 2. Cole todo esse código
// 3. Pressione Enter
// 4. Aguarde os resultados 