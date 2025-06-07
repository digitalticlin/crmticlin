
import { corsHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';
import { configureWebhookV2ForInstance } from './webhookConfigV2Service.ts';

/**
 * Serviço V3 para criação de instâncias - seguindo processo correto
 */

export async function createWhatsAppInstanceV3(supabase: any, instanceData: any, userId: string) {
  const creationId = `create_v3_${Date.now()}`;
  console.log(`[Instance Creation V3] ✨ Criando instância - PROCESSO CORRETO [${creationId}]:`, instanceData);

  try {
    const { instanceName, companyId } = instanceData;
    
    if (!instanceName) {
      throw new Error('Nome da instância é obrigatório');
    }

    console.log(`[Instance Creation V3] 📋 Dados da criação [${creationId}]:`, {
      instanceName,
      companyId,
      userId
    });

    // Gerar VPS Instance ID único
    const vpsInstanceId = `whatsapp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    console.log(`[Instance Creation V3] 🆔 VPS Instance ID gerado: ${vpsInstanceId}`);

    // 1. PRIMEIRO: Configurar webhook ANTES de criar na VPS
    console.log(`[Instance Creation V3] 🔧 Configurando webhook PRIMEIRO...`);
    
    // 2. SEGUNDO: Criar registro no banco
    const { data: newInstance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: instanceName,
        vps_instance_id: vpsInstanceId,
        connection_type: 'web',
        connection_status: 'connecting',
        web_status: 'connecting',
        company_id: companyId,
        created_by_user_id: userId,
        server_url: 'http://31.97.24.222:3001'
      })
      .select()
      .single();

    if (dbError) {
      console.error(`[Instance Creation V3] ❌ Erro ao criar no banco [${creationId}]:`, dbError);
      throw new Error(`Erro ao salvar instância: ${dbError.message}`);
    }

    console.log(`[Instance Creation V3] ✅ Instância criada no banco [${creationId}]:`, {
      id: newInstance.id,
      instanceName: newInstance.instance_name,
      vpsInstanceId: newInstance.vps_instance_id
    });

    // 3. TERCEIRO: Criar instância na VPS COM webhook já configurado
    console.log(`[Instance Creation V3] 🚀 Criando instância na VPS...`);
    
    const vpsPayload = {
      instanceId: vpsInstanceId,
      sessionName: vpsInstanceId,
      webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`,
      companyId: companyId,
      autoConfigWebhook: true // CORREÇÃO: Configurar webhook automaticamente
    };

    console.log(`[Instance Creation V3] 📡 Payload VPS:`, vpsPayload);

    const vpsResponse = await makeVPSRequest('/instance/create', 'POST', vpsPayload);

    if (!vpsResponse.success) {
      console.error(`[Instance Creation V3] ❌ Erro na VPS [${creationId}]:`, vpsResponse.error);
      
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

    console.log(`[Instance Creation V3] ✅ Instância criada na VPS [${creationId}]:`, vpsResponse.data);

    // 4. QUARTO: Verificar se webhook está funcionando
    setTimeout(async () => {
      try {
        const webhookResult = await configureWebhookV2ForInstance(
          supabase, 
          newInstance.id, 
          vpsInstanceId
        );
        
        console.log(`[Instance Creation V3] 🔗 Webhook verificado:`, webhookResult);
      } catch (webhookError) {
        console.error(`[Instance Creation V3] ⚠️ Erro na verificação do webhook:`, webhookError);
      }
    }, 2000);

    // 5. RETORNAR resposta imediata
    console.log(`[Instance Creation V3] 🎉 Instância criada com processo correto [${creationId}]`);

    return new Response(
      JSON.stringify({
        success: true,
        instance: {
          id: newInstance.id,
          instance_name: newInstance.instance_name,
          vps_instance_id: vpsInstanceId,
          connection_status: 'connecting',
          web_status: 'connecting',
          server_url: 'http://31.97.24.222:3001'
        },
        message: 'Instância criada com processo correto (V3)',
        creationId,
        webhookConfigured: true,
        processCorrect: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Instance Creation V3] ❌ Erro geral [${creationId}]:`, error);
    
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
