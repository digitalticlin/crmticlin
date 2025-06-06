
import { corsHeaders, VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequestService.ts';

export async function createWhatsAppInstance(supabase: any, instanceData: any, userId: string) {
  const createId = `create_${Date.now()}`;
  console.log(`[Instance Creation] 🚀 CORREÇÃO ROBUSTA - Criando instância [${createId}]:`, instanceData.instanceName);

  try {
    const { instanceName } = instanceData;
    
    if (!instanceName) {
      throw new Error('Nome da instância é obrigatório');
    }

    console.log(`[Instance Creation] 📋 CORREÇÃO ROBUSTA - Validações passaram para: ${instanceName}`);

    // Buscar company_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error(`[Instance Creation] ❌ CORREÇÃO ROBUSTA - Erro ao buscar perfil:`, profileError);
    }

    const companyId = profile?.company_id || null;
    console.log(`[Instance Creation] 🏢 CORREÇÃO ROBUSTA - Company ID: ${companyId}`);

    // Criar instância na VPS primeiro
    console.log(`[Instance Creation] 🌐 CORREÇÃO ROBUSTA - Criando na VPS...`);
    const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/create`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({
        instanceName,
        permanent: true,
        autoReconnect: true
      })
    });

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error(`[Instance Creation] ❌ CORREÇÃO ROBUSTA - Erro VPS:`, errorText);
      throw new Error(`Falha na VPS: ${vpsResponse.status} - ${errorText}`);
    }

    const vpsData = await vpsResponse.json();
    console.log(`[Instance Creation] ✅ CORREÇÃO ROBUSTA - VPS Response:`, vpsData);

    if (!vpsData.success || !vpsData.instanceId) {
      throw new Error(vpsData.error || 'VPS não retornou ID da instância');
    }

    const vpsInstanceId = vpsData.instanceId;
    console.log(`[Instance Creation] 🆔 CORREÇÃO ROBUSTA - VPS Instance ID: ${vpsInstanceId}`);

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

    console.log(`[Instance Creation] 💾 CORREÇÃO ROBUSTA - Salvando no Supabase:`, {
      instanceName,
      vpsInstanceId,
      hasQRCode: !!vpsData.qrCode,
      companyId,
      record: instanceRecord
    });

    // Salvar no Supabase
    const { data: savedInstance, error: saveError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceRecord)
      .select()
      .single();

    if (saveError) {
      console.error(`[Instance Creation] ❌ CORREÇÃO ROBUSTA - Erro salvamento:`, saveError);
      throw new Error(`Falha ao salvar no banco: ${saveError.message}`);
    }

    console.log(`[Instance Creation] ✅ CORREÇÃO ROBUSTA - Instância salva no Supabase [${createId}]:`, savedInstance);

    return new Response(
      JSON.stringify({
        success: true,
        instance: savedInstance,
        vpsData: vpsData,
        createId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Creation] ❌ CORREÇÃO ROBUSTA - Erro crítico [${createId}]:`, error);
    
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
