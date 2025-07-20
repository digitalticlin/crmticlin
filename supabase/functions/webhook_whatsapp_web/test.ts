
// ========================================
// TESTE AUTOMATIZADO DA WEBHOOK
// ========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WEBHOOK_URL = 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web';

interface TestPayload {
  name: string;
  payload: any;
  expectedResult: {
    success: boolean;
    shouldCreateLead: boolean;
    shouldCreateMessage: boolean;
  };
}

const testPayloads: TestPayload[] = [
  {
    name: "Mensagem de texto simples",
    payload: {
      event: "message_received",
      instanceId: "digitalticlin",
      from: "5562999887766",
      message: { text: "Olá, tudo bem?" },
      timestamp: Date.now(),
      fromMe: false,
      contactName: "João Silva",
      data: {
        messageId: "msg_test_001",
        body: "Olá, tudo bem?",
        messageType: "text"
      }
    },
    expectedResult: {
      success: true,
      shouldCreateLead: true,
      shouldCreateMessage: true
    }
  },
  {
    name: "Mensagem com mídia",
    payload: {
      event: "message_received",
      instanceId: "digitalticlin",
      from: "5562999887766",
      message: { text: "📷 Imagem" },
      timestamp: Date.now(),
      fromMe: false,
      contactName: "João Silva",
      messageType: "image",
      mediaUrl: "https://example.com/image.jpg",
      data: {
        messageId: "msg_test_002",
        body: "📷 Imagem",
        messageType: "image"
      }
    },
    expectedResult: {
      success: true,
      shouldCreateLead: true,
      shouldCreateMessage: true
    }
  },
  {
    name: "Mensagem formato Baileys",
    payload: {
      event: "messages.upsert",
      instanceId: "digitalticlin",
      data: {
        messages: [{
          key: {
            id: "msg_baileys_001",
            remoteJid: "5562999887766@s.whatsapp.net",
            fromMe: false
          },
          message: {
            conversation: "Teste formato Baileys"
          },
          messageTimestamp: Date.now()
        }]
      },
      contactName: "Maria Santos"
    },
    expectedResult: {
      success: true,
      shouldCreateLead: true,
      shouldCreateMessage: true
    }
  }
];

async function runTest(test: TestPayload): Promise<void> {
  console.log(`\n🧪 Executando teste: ${test.name}`);
  console.log(`📤 Payload:`, JSON.stringify(test.payload, null, 2));

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify(test.payload)
    });

    const result = await response.json();
    
    console.log(`📥 Resultado:`, {
      status: response.status,
      success: result.success,
      messageId: result.messageId,
      leadId: result.leadId,
      processingTime: result.processingTime,
      error: result.error
    });

    // Verificar se o teste passou
    if (result.success === test.expectedResult.success) {
      console.log(`✅ Teste PASSOU: ${test.name}`);
    } else {
      console.log(`❌ Teste FALHOU: ${test.name}`);
      console.log(`   Esperado: success=${test.expectedResult.success}`);
      console.log(`   Recebido: success=${result.success}`);
      if (result.error) {
        console.log(`   Erro: ${result.error}`);
      }
    }

  } catch (error) {
    console.error(`❌ Erro no teste "${test.name}":`, error.message);
  }
}

async function runAllTests(): Promise<void> {
  console.log('🚀 Iniciando testes automatizados da webhook...');
  console.log(`📍 URL: ${WEBHOOK_URL}`);
  console.log(`🔑 Service Key: ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Configurada' : 'NÃO CONFIGURADA'}`);

  for (const test of testPayloads) {
    await runTest(test);
    // Aguardar 2 segundos entre testes
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n🏁 Testes concluídos!');
}

// Executar testes automaticamente
if (import.meta.main) {
  await runAllTests();
}

// Também disponibilizar como endpoint HTTP para testes manuais
serve(async (req) => {
  if (req.method === 'GET') {
    await runAllTests();
    return new Response('Testes executados! Verifique os logs.', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  return new Response('Use GET para executar os testes', {
    status: 405
  });
});
