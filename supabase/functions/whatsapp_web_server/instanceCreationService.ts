
import { corsHeaders, VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequestService.ts';

export async function createWhatsAppInstance(supabase: any, instanceData: any, userId: string) {
  const createId = `create_${Date.now()}`;
  console.log(`[Instance Creation] 🔍 DIAGNÓSTICO COMPLETO - Iniciando [${createId}]:`, {
    instanceData,
    userId,
    vpsConfig: {
      baseUrl: VPS_CONFIG.baseUrl,
      tokenLength: VPS_CONFIG.token.length,
      tokenPreview: VPS_CONFIG.token.substring(0, 10) + '...'
    }
  });

  try {
    const { instanceName } = instanceData;
    
    if (!instanceName) {
      throw new Error('Nome da instância é obrigatório');
    }

    // Buscar company_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error(`[Instance Creation] ❌ Erro ao buscar perfil:`, profileError);
    }

    const companyId = profile?.company_id || null;
    const vpsInstanceId = `${instanceName}_${Date.now()}`;
    
    console.log(`[Instance Creation] 📋 Dados preparados:`, {
      instanceName,
      vpsInstanceId,
      companyId,
      userId
    });

    // TESTE SISTEMÁTICO: Vamos testar diferentes combinações
    const testCombinations = [
      {
        name: "TESTE 1 - Payload Completo com Webhook",
        endpoint: "/instance/create",
        headers: getVPSHeaders(),
        payload: {
          instanceId: vpsInstanceId,
          sessionName: vpsInstanceId,
          permanent: true,
          autoReconnect: true,
          webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
        }
      },
      {
        name: "TESTE 2 - Payload Sem Webhook",
        endpoint: "/instance/create",
        headers: getVPSHeaders(),
        payload: {
          instanceId: vpsInstanceId,
          sessionName: vpsInstanceId,
          permanent: true,
          autoReconnect: true
        }
      },
      {
        name: "TESTE 3 - Payload Mínimo",
        endpoint: "/instance/create",
        headers: getVPSHeaders(),
        payload: {
          instanceId: vpsInstanceId
        }
      },
      {
        name: "TESTE 4 - Endpoint Alternativo",
        endpoint: "/instances",
        headers: getVPSHeaders(),
        payload: {
          instanceId: vpsInstanceId,
          sessionName: vpsInstanceId,
          permanent: true,
          autoReconnect: true
        }
      },
      {
        name: "TESTE 5 - Sem Token de Autenticação",
        endpoint: "/instance/create",
        headers: { 'Content-Type': 'application/json' },
        payload: {
          instanceId: vpsInstanceId,
          sessionName: vpsInstanceId
        }
      }
    ];

    let successfulTest = null;
    let lastError = null;

    for (let i = 0; i < testCombinations.length; i++) {
      const test = testCombinations[i];
      
      console.log(`[Instance Creation] 🧪 ${test.name} - Executando...`);
      console.log(`[Instance Creation] 📤 URL: ${VPS_CONFIG.baseUrl}${test.endpoint}`);
      console.log(`[Instance Creation] 📤 Headers:`, test.headers);
      console.log(`[Instance Creation] 📤 Payload:`, test.payload);

      try {
        const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${test.endpoint}`, {
          method: 'POST',
          headers: test.headers,
          body: JSON.stringify(test.payload)
        });

        console.log(`[Instance Creation] 📥 ${test.name} - Status: ${response.status}`);

        if (response.ok) {
          const responseData = await response.json();
          console.log(`[Instance Creation] ✅ ${test.name} - SUCESSO!`, responseData);
          
          successfulTest = {
            testName: test.name,
            testIndex: i + 1,
            response: responseData,
            config: test
          };
          break;
        } else {
          const errorText = await response.text();
          console.log(`[Instance Creation] ❌ ${test.name} - Falhou: ${response.status} - ${errorText}`);
          lastError = `${response.status}: ${errorText}`;
        }

      } catch (error: any) {
        console.error(`[Instance Creation] ❌ ${test.name} - Erro de rede:`, error.message);
        lastError = error.message;
      }

      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!successfulTest) {
      console.error(`[Instance Creation] ❌ TODOS OS TESTES FALHARAM. Último erro: ${lastError}`);
      throw new Error(`Todos os testes falharam. Último erro: ${lastError}`);
    }

    // Se chegou aqui, um teste foi bem-sucedido
    console.log(`[Instance Creation] 🎉 SUCESSO NO ${successfulTest.testName}!`);

    // Preparar dados para salvamento no Supabase
    const instanceRecord = {
      instance_name: instanceName,
      vps_instance_id: vpsInstanceId,
      company_id: companyId,
      created_by_user_id: userId,
      connection_type: 'web',
      server_url: VPS_CONFIG.baseUrl,
      web_status: 'connecting',
      connection_status: 'connecting',
      qr_code: null,
      created_at: new Date().toISOString()
    };

    console.log(`[Instance Creation] 💾 Salvando no Supabase:`, instanceRecord);

    // Salvar no Supabase
    const { data: savedInstance, error: saveError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceRecord)
      .select()
      .single();

    if (saveError) {
      console.error(`[Instance Creation] ❌ Erro ao salvar no banco:`, saveError);
      throw new Error(`Falha ao salvar no banco: ${saveError.message}`);
    }

    console.log(`[Instance Creation] ✅ Instância salva com sucesso [${createId}]:`, savedInstance);

    return new Response(
      JSON.stringify({
        success: true,
        instance: savedInstance,
        vpsData: successfulTest.response,
        successfulTest: {
          name: successfulTest.testName,
          index: successfulTest.testIndex,
          config: successfulTest.config
        },
        createId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Creation] ❌ Erro crítico [${createId}]:`, {
      message: error.message,
      stack: error.stack,
      instanceData,
      vpsConfig: VPS_CONFIG
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        createId,
        timestamp: new Date().toISOString(),
        debug: {
          instanceData,
          vpsBaseUrl: VPS_CONFIG.baseUrl,
          userId
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
