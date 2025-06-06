
import { corsHeaders, VPS_CONFIG } from './config.ts';
import { createVPSInstance } from './vpsRequestService.ts';

export async function createWhatsAppInstance(supabase: any, instanceData: any, userId: string) {
  const creationId = `create_${Date.now()}`;
  console.log(`[Instance Creation] 🚀 CORREÇÃO COMPLETA - CRIANDO INSTÂNCIA [${creationId}]:`, instanceData);

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
      .maybeSingle();

    if (existingInstance) {
      throw new Error(`Já existe uma instância com o nome "${instanceName}" para este usuário`);
    }

    // 2. Gerar ID único para VPS
    const vpsInstanceId = `whatsapp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    console.log(`[Instance Creation] 📱 CORREÇÃO COMPLETA - VPS Instance ID gerado: ${vpsInstanceId}`);

    // 3. Buscar company_id do usuário (opcional)
    let companyId = null;
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .maybeSingle();

    if (userProfile?.company_id) {
      companyId = userProfile.company_id;
      console.log(`[Instance Creation] 🏢 CORREÇÃO COMPLETA - Company ID encontrado:`, companyId);
    } else {
      console.log(`[Instance Creation] ⚠️ CORREÇÃO COMPLETA - Usuário sem empresa - seguindo sem company_id`);
    }

    // 4. SALVAR NO BANCO PRIMEIRO para garantir que a instância existe
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

    console.log(`[Instance Creation] 💾 CORREÇÃO COMPLETA - Salvando no Supabase PRIMEIRO [${creationId}]`);
    
    const { data: savedInstance, error: saveError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceRecord)
      .select()
      .single();

    if (saveError) {
      console.error(`[Instance Creation] ❌ CORREÇÃO COMPLETA - Erro ao salvar no Supabase [${creationId}]:`, saveError);
      throw new Error(`Erro ao salvar instância: ${saveError.message}`);
    }

    console.log(`[Instance Creation] ✅ CORREÇÃO COMPLETA - Instância salva no Supabase [${creationId}]:`, savedInstance.id);

    // 5. Agora criar na VPS
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

    console.log(`[Instance Creation] 🌐 CORREÇÃO COMPLETA - Criando na VPS [${creationId}]:`, vpsPayload);
    const vpsResult = await createVPSInstance(vpsPayload);
    
    if (!vpsResult.success) {
      console.error(`[Instance Creation] ❌ CORREÇÃO COMPLETA - VPS falhou [${creationId}]:`, vpsResult.error);
      
      // CORREÇÃO: Se VPS falhar, manter instância no banco mas marcar como erro
      await supabase
        .from('whatsapp_instances')
        .update({ 
          web_status: 'error',
          connection_status: 'disconnected'
        })
        .eq('id', savedInstance.id);
      
      throw new Error(`Falha ao criar instância na VPS: ${vpsResult.error || 'Erro desconhecido'}`);
    }

    console.log(`[Instance Creation] ✅ CORREÇÃO COMPLETA - VPS criou instância [${creationId}]:`, vpsResult.data);

    // 6. Atualizar status no banco após sucesso na VPS
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

    // 7. Retornar estrutura esperada pelo frontend
    return new Response(
      JSON.stringify({
        success: true,
        instance: updatedInstance || savedInstance,
        vpsInstanceId: vpsInstanceId,
        vpsResponse: vpsResult.data,
        qrCode: null,
        creationId,
        message: 'Instância criada com sucesso - Use polling para obter QR Code'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Creation] ❌ CORREÇÃO COMPLETA - ERRO [${creationId}]:`, error);
    
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
