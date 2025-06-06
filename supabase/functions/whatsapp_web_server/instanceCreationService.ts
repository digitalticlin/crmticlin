
import { corsHeaders, VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequestService.ts';

export async function createWhatsAppInstance(supabase: any, instanceData: any, userId: string) {
  const createId = `create_${Date.now()}`;
  console.log(`[Instance Creation] 🚀 ANÁLISE PROFUNDA - Iniciando [${createId}]:`, {
    instanceData,
    userId,
    vpsConfig: {
      baseUrl: VPS_CONFIG.baseUrl,
      tokenLength: VPS_CONFIG.token.length,
      tokenStart: VPS_CONFIG.token.substring(0, 10)
    }
  });

  try {
    const { instanceName } = instanceData;
    
    if (!instanceName) {
      throw new Error('Nome da instância é obrigatório');
    }

    console.log(`[Instance Creation] 📋 ANÁLISE PROFUNDA - Validações OK:`, instanceName);

    // Buscar company_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error(`[Instance Creation] ❌ ANÁLISE PROFUNDA - Erro ao buscar perfil:`, profileError);
    }

    const companyId = profile?.company_id || null;
    console.log(`[Instance Creation] 🏢 ANÁLISE PROFUNDA - Company ID: ${companyId}`);

    // TESTE 1: Estrutura original simples
    const vpsInstanceId = `${instanceName}_${Date.now()}`;
    console.log(`[Instance Creation] 🧪 ANÁLISE PROFUNDA - TESTE 1 - Payload Simples`);
    
    const payload1 = {
      instanceId: vpsInstanceId,
      sessionName: vpsInstanceId,
      permanent: true,
      autoReconnect: true,
      webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
    };

    console.log(`[Instance Creation] 📤 ANÁLISE PROFUNDA - TESTE 1 - Enviando:`, {
      url: `${VPS_CONFIG.baseUrl}/instance/create`,
      method: 'POST',
      headers: getVPSHeaders(),
      payload: payload1
    });

    let vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/create`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify(payload1)
    });

    console.log(`[Instance Creation] 📥 ANÁLISE PROFUNDA - TESTE 1 - Status: ${vpsResponse.status}`);

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.log(`[Instance Creation] 🧪 ANÁLISE PROFUNDA - TESTE 1 FALHOU: ${errorText}`);
      
      // TESTE 2: Estrutura alternativa sem webhook
      console.log(`[Instance Creation] 🧪 ANÁLISE PROFUNDA - TESTE 2 - Sem Webhook`);
      
      const payload2 = {
        instanceId: vpsInstanceId,
        sessionName: vpsInstanceId,
        permanent: true,
        autoReconnect: true
      };

      console.log(`[Instance Creation] 📤 ANÁLISE PROFUNDA - TESTE 2 - Enviando:`, payload2);

      vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/create`, {
        method: 'POST',
        headers: getVPSHeaders(),
        body: JSON.stringify(payload2)
      });

      console.log(`[Instance Creation] 📥 ANÁLISE PROFUNDA - TESTE 2 - Status: ${vpsResponse.status}`);

      if (!vpsResponse.ok) {
        const errorText2 = await vpsResponse.text();
        console.log(`[Instance Creation] 🧪 ANÁLISE PROFUNDA - TESTE 2 FALHOU: ${errorText2}`);
        
        // TESTE 3: Apenas instanceId
        console.log(`[Instance Creation] 🧪 ANÁLISE PROFUNDA - TESTE 3 - Minimal`);
        
        const payload3 = {
          instanceId: vpsInstanceId
        };

        console.log(`[Instance Creation] 📤 ANÁLISE PROFUNDA - TESTE 3 - Enviando:`, payload3);

        vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/create`, {
          method: 'POST',
          headers: getVPSHeaders(),
          body: JSON.stringify(payload3)
        });

        console.log(`[Instance Creation] 📥 ANÁLISE PROFUNDA - TESTE 3 - Status: ${vpsResponse.status}`);

        if (!vpsResponse.ok) {
          const errorText3 = await vpsResponse.text();
          console.log(`[Instance Creation] 🧪 ANÁLISE PROFUNDA - TESTE 3 FALHOU: ${errorText3}`);
          
          // TESTE 4: Endpoint alternativo
          console.log(`[Instance Creation] 🧪 ANÁLISE PROFUNDA - TESTE 4 - Endpoint /instances`);
          
          vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instances`, {
            method: 'POST',
            headers: getVPSHeaders(),
            body: JSON.stringify(payload1)
          });

          console.log(`[Instance Creation] 📥 ANÁLISE PROFUNDA - TESTE 4 - Status: ${vpsResponse.status}`);

          if (!vpsResponse.ok) {
            const errorText4 = await vpsResponse.text();
            console.log(`[Instance Creation] 🧪 ANÁLISE PROFUNDA - TESTE 4 FALHOU: ${errorText4}`);
            
            // TESTE 5: Sem token (se for público)
            console.log(`[Instance Creation] 🧪 ANÁLISE PROFUNDA - TESTE 5 - Sem Token`);
            
            vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload1)
            });

            console.log(`[Instance Creation] 📥 ANÁLISE PROFUNDA - TESTE 5 - Status: ${vpsResponse.status}`);

            if (!vpsResponse.ok) {
              const errorText5 = await vpsResponse.text();
              console.log(`[Instance Creation] ❌ ANÁLISE PROFUNDA - TODOS OS TESTES FALHARAM`);
              throw new Error(`Todos os testes falharam. Último erro: ${vpsResponse.status} - ${errorText5}`);
            }
          }
        }
      }
    }

    // Se chegou aqui, algum teste funcionou
    const vpsData = await vpsResponse.json();
    console.log(`[Instance Creation] ✅ ANÁLISE PROFUNDA - SUCESSO! Resposta VPS:`, vpsData);

    if (!vpsData.success) {
      throw new Error(vpsData.error || 'VPS não confirmou criação da instância');
    }

    console.log(`[Instance Creation] 🆔 ANÁLISE PROFUNDA - VPS Instance ID: ${vpsInstanceId}`);

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

    console.log(`[Instance Creation] 💾 ANÁLISE PROFUNDA - Salvando no Supabase:`, instanceRecord);

    // Salvar no Supabase
    const { data: savedInstance, error: saveError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceRecord)
      .select()
      .single();

    if (saveError) {
      console.error(`[Instance Creation] ❌ ANÁLISE PROFUNDA - Erro salvamento:`, saveError);
      throw new Error(`Falha ao salvar no banco: ${saveError.message}`);
    }

    console.log(`[Instance Creation] ✅ ANÁLISE PROFUNDA - Instância salva no Supabase [${createId}]:`, savedInstance);

    return new Response(
      JSON.stringify({
        success: true,
        instance: savedInstance,
        vpsData: vpsData,
        createId,
        testResult: 'SUCESSO EM UM DOS TESTES'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Creation] ❌ ANÁLISE PROFUNDA - Erro crítico [${createId}]:`, {
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
