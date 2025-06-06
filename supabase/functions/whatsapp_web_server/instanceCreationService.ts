
import { corsHeaders, VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequestService.ts';

export async function createWhatsAppInstance(supabase: any, instanceData: any, userId: string) {
  const createId = `create_${Date.now()}`;
  console.log(`[Instance Creation] 🎯 USANDO CONFIGURAÇÃO QUE FUNCIONA - Iniciando [${createId}]:`, instanceData);

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
    
    console.log(`[Instance Creation] 📋 Usando configuração testada e aprovada:`, {
      instanceName,
      vpsInstanceId,
      companyId,
      userId
    });

    // USAR A CONFIGURAÇÃO QUE DEU CERTO NO TESTE 31
    const workingConfig = {
      endpoint: '/instance/create',
      headers: { 'Content-Type': 'application/json' }, // sem token
      payload: {
        instanceId: vpsInstanceId,
        sessionName: vpsInstanceId,
        permanent: true,
        autoReconnect: true,
        webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
      }
    };

    console.log(`[Instance Creation] ✅ Usando configuração do TESTE 31 que funcionou`);

    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${workingConfig.endpoint}`, {
      method: 'POST',
      headers: workingConfig.headers,
      body: JSON.stringify(workingConfig.payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VPS Create Failed: ${response.status} - ${errorText}`);
    }

    const vpsResponseData = await response.json();
    console.log(`[Instance Creation] ✅ Instância criada com sucesso na VPS:`, vpsResponseData);

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
        vpsData: vpsResponseData,
        message: 'Instância criada com configuração testada',
        createId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Creation] ❌ Erro crítico [${createId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        createId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
