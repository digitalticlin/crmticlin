
import { corsHeaders, VPS_CONFIG } from './config.ts';
import { createVPSInstance } from './vpsRequestService.ts';

export async function createWhatsAppInstance(supabase: any, instanceData: any, userId: string) {
  const creationId = `create_${Date.now()}`;
  console.log(`[Instance Creation] 🚀 CRIANDO INSTÂNCIA [${creationId}]:`, instanceData);

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
      .single();

    if (existingInstance) {
      throw new Error(`Já existe uma instância com o nome "${instanceName}"`);
    }

    // 2. Gerar ID único para VPS
    const vpsInstanceId = `whatsapp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    console.log(`[Instance Creation] 📱 VPS Instance ID gerado: ${vpsInstanceId}`);

    // 3. Buscar dados do usuário
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (!userProfile?.company_id) {
      throw new Error('Usuário não possui empresa associada');
    }

    // 4. Criar instância na VPS
    const webhookUrl = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
    const vpsPayload = {
      instanceId: vpsInstanceId,
      sessionName: instanceName,
      webhookUrl: webhookUrl,
      companyId: userProfile.company_id,
      webhook: true,
      webhook_by_events: true,
      webhookEvents: ['messages.upsert', 'qr.update', 'connection.update']
    };

    console.log('[Instance Creation] 🌐 Enviando para VPS:', vpsPayload);
    const vpsResult = await createVPSInstance(vpsPayload);
    
    if (!vpsResult.success) {
      throw new Error(`Falha ao criar instância na VPS: ${vpsResult.error || 'Erro desconhecido'}`);
    }

    console.log('[Instance Creation] ✅ Instância criada na VPS com sucesso');

    // 5. Salvar no Supabase
    const instanceRecord = {
      instance_name: instanceName,
      vps_instance_id: vpsInstanceId,
      company_id: userProfile.company_id,
      connection_type: 'web',
      server_url: VPS_CONFIG.baseUrl,
      web_status: 'connecting',
      connection_status: 'connecting',
      qr_code: vpsResult.qrCode || null,
      created_at: new Date().toISOString()
    };

    const { data: savedInstance, error: saveError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceRecord)
      .select()
      .single();

    if (saveError) {
      console.error('[Instance Creation] ❌ Erro ao salvar no Supabase:', saveError);
      throw new Error(`Erro ao salvar instância: ${saveError.message}`);
    }

    console.log(`[Instance Creation] ✅ Instância salva no Supabase [${creationId}]:`, savedInstance.id);

    return new Response(
      JSON.stringify({
        success: true,
        instance: savedInstance,
        vpsInstanceId: vpsInstanceId,
        qrCode: vpsResult.qrCode,
        creationId,
        message: 'Instância criada com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Creation] ❌ ERRO GERAL [${creationId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        creationId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
