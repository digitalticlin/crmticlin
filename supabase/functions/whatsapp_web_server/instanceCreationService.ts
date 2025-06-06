
import { corsHeaders, VPS_CONFIG } from './config.ts';
import { createVPSInstance } from './vpsRequestService.ts';

export async function createWhatsAppInstance(supabase: any, instanceData: any, userId: string) {
  const creationId = `create_${Date.now()}`;
  console.log(`[Instance Creation] 🚀 CORREÇÃO DEFINITIVA - CRIANDO INSTÂNCIA [${creationId}]:`, instanceData);

  try {
    const { instanceName } = instanceData;
    
    if (!instanceName) {
      throw new Error('Nome da instância é obrigatório');
    }

    // 1. Verificar se já existe instância com esse nome para este usuário
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_name')
      .eq('instance_name', instanceName)
      .eq('created_by_user_id', userId)
      .single();

    if (existingInstance) {
      throw new Error(`Já existe uma instância com o nome "${instanceName}" para este usuário`);
    }

    // 2. Gerar ID único para VPS
    const vpsInstanceId = `whatsapp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    console.log(`[Instance Creation] 📱 VPS Instance ID gerado: ${vpsInstanceId}`);

    // 3. Buscar company_id do usuário (opcional)
    let companyId = null;
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userProfile?.company_id) {
      companyId = userProfile.company_id;
      console.log(`[Instance Creation] 🏢 Company ID encontrado:`, companyId);
    } else {
      console.log(`[Instance Creation] ⚠️ Usuário sem empresa - seguindo sem company_id`);
    }

    // 4. Criar instância na VPS com estrutura correta
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

    console.log('[Instance Creation] 🌐 Enviando para VPS (estrutura corrigida):', vpsPayload);
    const vpsResult = await createVPSInstance(vpsPayload);
    
    if (!vpsResult.success) {
      throw new Error(`Falha ao criar instância na VPS: ${vpsResult.error || 'Erro desconhecido'}`);
    }

    console.log('[Instance Creation] ✅ VPS retornou:', vpsResult.data);

    // 5. Processar resposta da VPS (estrutura real identificada)
    const { success, instanceId: vpsReturnedId, status, message } = vpsResult.data;
    
    if (!success) {
      throw new Error(`VPS falhou: ${message || 'Erro na criação'}`);
    }

    // 6. Salvar no Supabase (sem esperar QR Code da criação)
    const instanceRecord = {
      instance_name: instanceName,
      vps_instance_id: vpsInstanceId, // Usar o que enviamos, não o que VPS retornou
      company_id: companyId,
      created_by_user_id: userId,
      connection_type: 'web',
      server_url: VPS_CONFIG.baseUrl,
      web_status: 'connecting', // Status inicial
      connection_status: 'connecting',
      qr_code: null, // QR Code será obtido via polling
      created_at: new Date().toISOString()
    };

    const { data: savedInstance, error: saveError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceRecord)
      .select()
      .single();

    if (saveError) {
      console.error('[Instance Creation] ❌ Erro ao salvar no Supabase:', saveError);
      // Tentar limpar da VPS se salvamento falhou
      try {
        await createVPSInstance({ action: 'delete', instanceId: vpsInstanceId });
      } catch (cleanupError) {
        console.error('[Instance Creation] ⚠️ Falha no cleanup VPS:', cleanupError);
      }
      throw new Error(`Erro ao salvar instância: ${saveError.message}`);
    }

    console.log(`[Instance Creation] ✅ Instância salva no Supabase [${creationId}]:`, savedInstance.id);

    // 7. Retornar estrutura esperada pelo frontend
    return new Response(
      JSON.stringify({
        success: true,
        instance: savedInstance,
        vpsInstanceId: vpsInstanceId,
        vpsResponse: vpsResult.data,
        qrCode: null, // QR Code será obtido via polling separado
        creationId,
        message: 'Instância criada com sucesso - Use polling para obter QR Code'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Creation] ❌ ERRO CORREÇÃO DEFINITIVA [${creationId}]:`, error);
    
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
