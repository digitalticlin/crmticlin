
import { corsHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';
import { autoConfigureWebhookV2 } from './webhookConfigV2Service.ts';

/**
 * Serviço V2 para criação de instâncias - com webhook automático
 */

export async function createWhatsAppInstanceV2(supabase: any, instanceData: any, userId: string) {
  const creationId = `create_v2_${Date.now()}`;
  console.log(`[Instance Creation V2] ✨ Criando instância melhorada [${creationId}]:`, instanceData);

  try {
    const { instanceName, companyId } = instanceData;
    
    if (!instanceName) {
      throw new Error('Nome da instância é obrigatório');
    }

    console.log(`[Instance Creation V2] 📋 Dados da criação [${creationId}]:`, {
      instanceName,
      companyId,
      userId
    });

    // Gerar VPS Instance ID único
    const vpsInstanceId = `whatsapp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    console.log(`[Instance Creation V2] 🆔 VPS Instance ID gerado: ${vpsInstanceId}`);

    // 1. PRIMEIRO: Criar registro no banco
    const { data: newInstance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: instanceName,
        vps_instance_id: vpsInstanceId,
        connection_type: 'web',
        connection_status: 'creating',
        web_status: 'creating',
        company_id: companyId,
        created_by_user_id: userId,
        server_url: 'http://31.97.24.222:3001'
      })
      .select()
      .single();

    if (dbError) {
      console.error(`[Instance Creation V2] ❌ Erro ao criar no banco [${creationId}]:`, dbError);
      throw new Error(`Erro ao salvar instância: ${dbError.message}`);
    }

    console.log(`[Instance Creation V2] ✅ Instância criada no banco [${creationId}]:`, {
      id: newInstance.id,
      instanceName: newInstance.instance_name,
      vpsInstanceId: newInstance.vps_instance_id
    });

    // 2. SEGUNDO: Criar instância na VPS
    console.log(`[Instance Creation V2] 🚀 Criando instância na VPS...`);
    
    const vpsPayload = {
      instanceId: vpsInstanceId,
      sessionName: vpsInstanceId, // Usar o mesmo ID como session name
      webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`,
      companyId: companyId
    };

    console.log(`[Instance Creation V2] 📡 Payload VPS:`, vpsPayload);

    const vpsResponse = await makeVPSRequest('/instance/create', 'POST', vpsPayload);

    if (!vpsResponse.success) {
      console.error(`[Instance Creation V2] ❌ Erro na VPS [${creationId}]:`, vpsResponse.error);
      
      // Atualizar status no banco como erro
      await supabase
        .from('whatsapp_instances')
        .update({
          connection_status: 'error',
          web_status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', newInstance.id);

      throw new Error(`Erro na VPS: ${vpsResponse.error}`);
    }

    console.log(`[Instance Creation V2] ✅ Instância criada na VPS [${creationId}]:`, vpsResponse.data);

    // 3. TERCEIRO: Atualizar status no banco
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        connection_status: 'initializing',
        web_status: 'initializing',
        updated_at: new Date().toISOString()
      })
      .eq('id', newInstance.id);

    if (updateError) {
      console.error(`[Instance Creation V2] ⚠️ Erro ao atualizar status:`, updateError);
    }

    // 4. QUARTO: Configurar webhook automaticamente (assíncrono)
    console.log(`[Instance Creation V2] 🔧 Configurando webhook automaticamente...`);
    
    // Aguardar um pouco para a instância VPS estar pronta
    setTimeout(async () => {
      try {
        const webhookResult = await autoConfigureWebhookV2(supabase, {
          instanceId: newInstance.id,
          vpsInstanceId: vpsInstanceId
        });
        
        console.log(`[Instance Creation V2] 🔗 Webhook configurado:`, webhookResult);
      } catch (webhookError) {
        console.error(`[Instance Creation V2] ⚠️ Erro no webhook automático:`, webhookError);
      }
    }, 3000);

    // 5. RETORNAR resposta imediata
    console.log(`[Instance Creation V2] 🎉 Instância criada com sucesso [${creationId}]`);

    return new Response(
      JSON.stringify({
        success: true,
        instance: {
          id: newInstance.id,
          instance_name: newInstance.instance_name,
          vps_instance_id: vpsInstanceId,
          connection_status: 'initializing',
          web_status: 'initializing',
          server_url: 'http://31.97.24.222:3001'
        },
        message: 'Instância criada com sucesso',
        creationId,
        webhookConfiguring: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Instance Creation V2] ❌ Erro geral [${creationId}]:`, error);
    
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
