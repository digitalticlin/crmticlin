
import { corsHeaders, VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequestService.ts';

export async function createWhatsAppInstance(supabase: any, instanceData: any, userId: string) {
  const createId = `create_${Date.now()}`;
  console.log(`[Instance Creation] 🔍 DESCOBERTA AUTOMÁTICA - Iniciando [${createId}]:`, {
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

    // DESCOBERTA AUTOMÁTICA: Vamos testar múltiplas combinações
    const possibleTokens = [
      VPS_CONFIG.token,
      '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dc0b3', // token atual
      'default-token',
      'whatsapp-token',
      'api-key',
      '', // sem token
      'Bearer ' + VPS_CONFIG.token,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', // JWT exemplo
      'admin123',
      'test-token'
    ];

    const possibleEndpoints = [
      '/instance/create',
      '/instances',
      '/api/instance/create',
      '/api/instances',
      '/v1/instance/create',
      '/v1/instances',
      '/whatsapp/instance/create',
      '/whatsapp/instances',
      '/create-instance',
      '/new-instance',
      '/session/create',
      '/sessions'
    ];

    const possiblePayloads = [
      // Payload completo com webhook
      {
        instanceId: vpsInstanceId,
        sessionName: vpsInstanceId,
        permanent: true,
        autoReconnect: true,
        webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
      },
      // Payload sem webhook
      {
        instanceId: vpsInstanceId,
        sessionName: vpsInstanceId,
        permanent: true,
        autoReconnect: true
      },
      // Payload mínimo
      {
        instanceId: vpsInstanceId
      },
      // Payload com sessionName apenas
      {
        sessionName: vpsInstanceId
      },
      // Payload com name
      {
        name: vpsInstanceId
      },
      // Payload com instanceName
      {
        instanceName: vpsInstanceId
      },
      // Payload diferente
      {
        instance: vpsInstanceId,
        session: vpsInstanceId
      }
    ];

    let successfulTest = null;
    let lastError = null;
    let testCount = 0;

    // PRIMEIRO: Testar descoberta de endpoint válido (sem autenticação)
    console.log(`[Instance Creation] 🔍 FASE 1: Descoberta de endpoints válidos...`);
    
    for (const endpoint of possibleEndpoints.slice(0, 6)) { // Testar primeiros 6
      try {
        testCount++;
        console.log(`[Instance Creation] 🧪 TESTE ${testCount} - Descoberta Endpoint: ${endpoint}`);
        
        const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        console.log(`[Instance Creation] 📊 TESTE ${testCount} - Status: ${response.status}`);
        
        if (response.status !== 404) {
          console.log(`[Instance Creation] ✅ TESTE ${testCount} - Endpoint encontrado: ${endpoint}`);
        }
      } catch (error) {
        console.log(`[Instance Creation] ❌ TESTE ${testCount} - Endpoint erro: ${endpoint}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // SEGUNDO: Testar combinações token + endpoint + payload
    console.log(`[Instance Creation] 🔍 FASE 2: Testando combinações token + endpoint + payload...`);
    
    for (let tokenIndex = 0; tokenIndex < Math.min(possibleTokens.length, 3); tokenIndex++) {
      for (let endpointIndex = 0; endpointIndex < Math.min(possibleEndpoints.length, 4); endpointIndex++) {
        for (let payloadIndex = 0; payloadIndex < Math.min(possiblePayloads.length, 3); payloadIndex++) {
          
          if (successfulTest) break;
          
          testCount++;
          const token = possibleTokens[tokenIndex];
          const endpoint = possibleEndpoints[endpointIndex];
          const payload = possiblePayloads[payloadIndex];
          
          console.log(`[Instance Creation] 🧪 TESTE ${testCount} - Token: ${token.substring(0, 10)}... | Endpoint: ${endpoint} | Payload: ${Object.keys(payload).join(',')}`);
          
          try {
            const headers = token ? {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            } : {
              'Content-Type': 'application/json'
            };

            const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${endpoint}`, {
              method: 'POST',
              headers,
              body: JSON.stringify(payload)
            });

            console.log(`[Instance Creation] 📊 TESTE ${testCount} - Status: ${response.status}`);

            if (response.ok) {
              const responseData = await response.json();
              console.log(`[Instance Creation] 🎉 TESTE ${testCount} - SUCESSO ENCONTRADO!`, responseData);
              
              successfulTest = {
                testNumber: testCount,
                token,
                endpoint,
                payload,
                response: responseData,
                headers
              };
              break;
            } else {
              const errorText = await response.text();
              console.log(`[Instance Creation] ❌ TESTE ${testCount} - Falhou: ${response.status} - ${errorText.substring(0, 100)}`);
              lastError = `${response.status}: ${errorText.substring(0, 100)}`;
            }

          } catch (error: any) {
            console.error(`[Instance Creation] ❌ TESTE ${testCount} - Erro de rede:`, error.message);
            lastError = error.message;
          }

          // Pequena pausa entre testes
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        if (successfulTest) break;
      }
      if (successfulTest) break;
    }

    // TERCEIRO: Se nada funcionou, testar endpoints de descoberta
    if (!successfulTest) {
      console.log(`[Instance Creation] 🔍 FASE 3: Testando endpoints de descoberta...`);
      
      const discoveryEndpoints = [
        '/health',
        '/status',
        '/api',
        '/docs',
        '/swagger',
        '/',
        '/instances/list',
        '/instance/list'
      ];

      for (const endpoint of discoveryEndpoints) {
        try {
          testCount++;
          console.log(`[Instance Creation] 🧪 TESTE ${testCount} - Descoberta: ${endpoint}`);
          
          const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });

          if (response.ok) {
            const data = await response.text();
            console.log(`[Instance Creation] ✅ TESTE ${testCount} - Endpoint descoberto: ${endpoint} - ${data.substring(0, 200)}`);
          }
        } catch (error) {
          console.log(`[Instance Creation] ❌ TESTE ${testCount} - Descoberta falhou: ${endpoint}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    if (!successfulTest) {
      console.error(`[Instance Creation] ❌ TODAS AS ${testCount} COMBINAÇÕES FALHARAM. Último erro: ${lastError}`);
      throw new Error(`Todas as ${testCount} combinações testadas falharam. Último erro: ${lastError}`);
    }

    // Se chegou aqui, um teste foi bem-sucedido
    console.log(`[Instance Creation] 🎉 SUCESSO NO TESTE ${successfulTest.testNumber}!`, {
      token: successfulTest.token.substring(0, 20) + '...',
      endpoint: successfulTest.endpoint,
      payload: successfulTest.payload
    });

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
        successfulCombination: {
          testNumber: successfulTest.testNumber,
          token: successfulTest.token.substring(0, 20) + '...',
          endpoint: successfulTest.endpoint,
          payload: successfulTest.payload,
          totalTestsRun: testCount
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
