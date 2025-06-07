
import { corsHeaders, VPS_CONFIG } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';

export async function createWhatsAppInstance(supabase: any, instanceData: any, userId: string) {
  const creationId = `create_${Date.now()}`;
  console.log(`[Instance Creation] 🚀 Criando instância [${creationId}]:`, instanceData);

  try {
    const { instanceName } = instanceData;
    
    if (!instanceName) {
      throw new Error('Nome da instância é obrigatório');
    }

    // 1. Verificar se já existe instância com esse nome
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_name')
      .eq('instance_name', instanceName)
      .eq('created_by_user_id', userId)
      .maybeSingle();

    if (existingInstance) {
      throw new Error(`Já existe uma instância com o nome "${instanceName}"`);
    }

    // 2. Gerar ID único para VPS
    const vpsInstanceId = `whatsapp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    console.log(`[Instance Creation] 📱 VPS Instance ID: ${vpsInstanceId}`);

    // 3. Buscar company_id do usuário
    let companyId = null;
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .maybeSingle();

    if (userProfile?.company_id) {
      companyId = userProfile.company_id;
    }

    // 4. Salvar no banco PRIMEIRO
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

    console.log(`[Instance Creation] 💾 Salvando no Supabase [${creationId}]`);
    
    const { data: savedInstance, error: saveError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceRecord)
      .select()
      .single();

    if (saveError) {
      console.error(`[Instance Creation] ❌ Erro ao salvar [${creationId}]:`, saveError);
      throw new Error(`Erro ao salvar instância: ${saveError.message}`);
    }

    console.log(`[Instance Creation] ✅ Instância salva [${creationId}]:`, savedInstance.id);

    // 5. Criar na VPS
    const webhookUrl = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
    const vpsPayload = {
      instanceId: vpsInstanceId,
      sessionName: instanceName,
      webhookUrl: webhookUrl,
      companyId: companyId || userId,
      webhook: true,
      webhook_by_events: true,
      webhookEvents: ['messages.upsert', 'qr.update', 'connection.update']
    };

    console.log(`[Instance Creation] 🌐 Criando na VPS [${creationId}]`);
    const vpsResponse = await makeVPSRequest('/instance/create', 'POST', vpsPayload);
    
    if (!vpsResponse.success) {
      console.error(`[Instance Creation] ❌ VPS falhou [${creationId}]:`, vpsResponse.error);
      
      // Marcar como erro mas manter no banco
      await supabase
        .from('whatsapp_instances')
        .update({ 
          web_status: 'error',
          connection_status: 'disconnected'
        })
        .eq('id', savedInstance.id);
      
      throw new Error(`Falha ao criar instância na VPS: ${vpsResponse.error}`);
    }

    console.log(`[Instance Creation] ✅ VPS criou instância [${creationId}]`);

    // 6. Atualizar status após sucesso na VPS
    const { data: updatedInstance } = await supabase
      .from('whatsapp_instances')
      .update({ 
        web_status: 'waiting_scan',
        connection_status: 'connecting',
        updated_at: new Date().toISOString()
      })
      .eq('id', savedInstance.id)
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        instance: updatedInstance || savedInstance,
        vpsInstanceId: vpsInstanceId,
        qrCode: null,
        creationId,
        message: 'Instância criada com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Creation] ❌ ERRO [${creationId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        creationId
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
