
import { corsHeaders } from './config.ts';
import { VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';

/**
 * Configuração Global do Webhook na VPS
 * Esta função configura um webhook único para TODAS as instâncias da VPS
 */
export async function configureGlobalWebhook(supabase: any) {
  const globalConfigId = `global_webhook_${Date.now()}`;
  console.log(`[Global Webhook] 🌐 Iniciando configuração global [${globalConfigId}]`);
  
  try {
    // URL do webhook global que receberá mensagens de TODAS as instâncias
    const globalWebhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`;
    
    console.log(`[Global Webhook] 📡 URL do webhook global: ${globalWebhookUrl}`);

    // 1. Configurar webhook global na VPS
    const configureResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/webhook/global`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({
        webhookUrl: globalWebhookUrl,
        events: ['messages.upsert', 'connection.update'],
        description: 'Webhook global para multi-tenant CRM',
        configId: globalConfigId
      })
    });

    if (!configureResponse.ok) {
      const errorText = await configureResponse.text();
      throw new Error(`Falha ao configurar webhook global: ${configureResponse.status} - ${errorText}`);
    }

    const configData = await configureResponse.json();
    console.log(`[Global Webhook] ✅ Webhook global configurado:`, configData);

    // 2. Salvar configuração no Supabase para tracking
    const { data: configRecord, error: saveError } = await supabase
      .from('sync_logs')
      .insert({
        function_name: 'configure_global_webhook',
        status: 'success',
        result: {
          globalConfigId,
          webhookUrl: globalWebhookUrl,
          vpsResponse: configData
        }
      })
      .select()
      .single();

    if (saveError) {
      console.error(`[Global Webhook] ⚠️ Erro ao salvar config:`, saveError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        globalConfigId,
        webhookUrl: globalWebhookUrl,
        message: 'Webhook global configurado com sucesso',
        vpsResponse: configData,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Global Webhook] ❌ Erro na configuração global [${globalConfigId}]:`, error);
    
    // Log do erro
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'configure_global_webhook',
        status: 'error',
        error_message: error.message
      });

    return new Response(
      JSON.stringify({
        success: false,
        globalConfigId,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

/**
 * Auto-configuração para novas instâncias
 * Quando uma instância é criada, ela automaticamente herda o webhook global
 */
export async function autoConfigureInstanceWebhook(supabase: any, instanceId: string) {
  console.log(`[Auto Webhook] 🔧 Auto-configurando webhook para instância: ${instanceId}`);
  
  try {
    const globalWebhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`;
    
    // Verificar se a instância precisa de configuração específica
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/webhook`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({
        instanceId,
        webhookUrl: globalWebhookUrl,
        inherit: true // Herdar configuração global
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[Auto Webhook] ✅ Webhook auto-configurado para ${instanceId}:`, data);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.error(`[Auto Webhook] ❌ Erro na auto-configuração ${instanceId}:`, errorText);
      return { success: false, error: errorText };
    }

  } catch (error) {
    console.error(`[Auto Webhook] ❌ Erro na auto-configuração ${instanceId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar status do webhook global
 */
export async function checkGlobalWebhookStatus() {
  console.log(`[Global Webhook] 🔍 Verificando status do webhook global`);
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/webhook/status`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[Global Webhook] 📊 Status:`, data);
      
      return new Response(
        JSON.stringify({
          success: true,
          status: data,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      throw new Error(`Erro ao verificar status: ${response.status} - ${errorText}`);
    }

  } catch (error) {
    console.error(`[Global Webhook] ❌ Erro ao verificar status:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

/**
 * Sincronização multi-tenant
 * Processa mensagens identificando a empresa via vps_instance_id
 */
export async function processMultiTenantMessage(supabase: any, messageData: any) {
  const processId = `process_${Date.now()}`;
  console.log(`[Multi-Tenant] 🏢 Processando mensagem multi-tenant [${processId}]:`, messageData);

  try {
    const { instanceName, data: webhookData, event } = messageData;
    
    if (!instanceName) {
      throw new Error('instanceName não fornecido no webhook');
    }

    // 1. CRÍTICO: Buscar instância pelo vps_instance_id
    console.log(`[Multi-Tenant] 🔍 Buscando instância: ${instanceName}`);
    
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select(`
        *,
        companies!whatsapp_instances_company_id_fkey (
          id,
          name
        )
      `)
      .eq('vps_instance_id', instanceName)
      .eq('connection_type', 'web')
      .single();

    if (instanceError || !instance) {
      console.error(`[Multi-Tenant] ❌ Instância não encontrada: ${instanceName}`, instanceError);
      
      // Log do erro para debug
      await supabase
        .from('sync_logs')
        .insert({
          function_name: 'process_multi_tenant_message',
          status: 'error',
          error_message: `Instância não encontrada: ${instanceName}`,
          result: { instanceName, event, processId }
        });

      return { success: false, error: 'Instância não encontrada', instanceName };
    }

    console.log(`[Multi-Tenant] ✅ Instância encontrada:`, {
      id: instance.id,
      company: instance.companies?.name,
      company_id: instance.company_id
    });

    // 2. Processar mensagem baseado no evento
    let result = { success: true, processed: false };

    if (event === 'messages.upsert' && webhookData.messages) {
      result = await processIncomingMessage(supabase, instance, webhookData, processId);
    } else if (event === 'connection.update') {
      result = await processConnectionUpdate(supabase, instance, webhookData, processId);
    }

    // 3. Log do processamento
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'process_multi_tenant_message',
        status: result.success ? 'success' : 'error',
        result: {
          processId,
          instanceName,
          company_id: instance.company_id,
          event,
          processed: result.processed
        }
      });

    return result;

  } catch (error) {
    console.error(`[Multi-Tenant] ❌ Erro no processamento [${processId}]:`, error);
    
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'process_multi_tenant_message',
        status: 'error',
        error_message: error.message,
        result: { processId, messageData }
      });

    return { success: false, error: error.message, processId };
  }
}

// Função auxiliar para processar mensagens recebidas
async function processIncomingMessage(supabase: any, instance: any, messageData: any, processId: string) {
  console.log(`[Multi-Tenant] 📨 Processando mensagem recebida [${processId}]`);
  
  try {
    const message = messageData.messages?.[0];
    if (!message) return { success: true, processed: false };

    const fromNumber = message.key?.remoteJid?.replace('@s.whatsapp.net', '');
    const messageText = message.message?.conversation || 
                       message.message?.extendedTextMessage?.text || 
                       '[Mídia]';
    
    console.log(`[Multi-Tenant] 👤 De: ${fromNumber} | Empresa: ${instance.companies?.name}`);
    console.log(`[Multi-Tenant] 💬 Mensagem: ${messageText}`);

    // Buscar ou criar lead
    let { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', fromNumber)
      .eq('whatsapp_number_id', instance.id)
      .eq('company_id', instance.company_id) // IMPORTANTE: Filtrar por empresa
      .single();

    if (leadError || !lead) {
      console.log(`[Multi-Tenant] 👤 Criando novo lead para empresa ${instance.company_id}`);
      
      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          phone: fromNumber,
          name: fromNumber,
          whatsapp_number_id: instance.id,
          company_id: instance.company_id, // CRÍTICO: Vincular à empresa
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          unread_count: 1
        })
        .select()
        .single();

      if (createError) {
        console.error(`[Multi-Tenant] ❌ Erro ao criar lead:`, createError);
        return { success: false, error: createError.message };
      }
      
      lead = newLead;
      console.log(`[Multi-Tenant] ✅ Lead criado: ${lead.id}`);
    } else {
      // Atualizar lead existente
      await supabase
        .from('leads')
        .update({
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          unread_count: (lead.unread_count || 0) + 1
        })
        .eq('id', lead.id);
      
      console.log(`[Multi-Tenant] ✅ Lead atualizado: ${lead.id}`);
    }

    // Salvar mensagem
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        lead_id: lead.id,
        whatsapp_number_id: instance.id,
        text: messageText,
        from_me: false,
        timestamp: new Date().toISOString(),
        external_id: message.key?.id,
        status: 'received'
      });

    if (messageError) {
      console.error(`[Multi-Tenant] ❌ Erro ao salvar mensagem:`, messageError);
      return { success: false, error: messageError.message };
    }

    console.log(`[Multi-Tenant] ✅ Mensagem salva para empresa ${instance.companies?.name}`);
    return { success: true, processed: true, leadId: lead.id };

  } catch (error) {
    console.error(`[Multi-Tenant] ❌ Erro ao processar mensagem:`, error);
    return { success: false, error: error.message };
  }
}

// Função auxiliar para processar atualizações de conexão
async function processConnectionUpdate(supabase: any, instance: any, connectionData: any, processId: string) {
  console.log(`[Multi-Tenant] 🔗 Processando atualização de conexão [${processId}]`);
  
  try {
    const connectionStatus = connectionData.connection || 'unknown';
    
    await supabase
      .from('whatsapp_instances')
      .update({
        connection_status: connectionStatus,
        web_status: connectionStatus === 'open' ? 'ready' : 'disconnected',
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    console.log(`[Multi-Tenant] ✅ Status atualizado para ${instance.companies?.name}: ${connectionStatus}`);
    return { success: true, processed: true, status: connectionStatus };
    
  } catch (error) {
    console.error(`[Multi-Tenant] ❌ Erro ao atualizar conexão:`, error);
    return { success: false, error: error.message };
  }
}
