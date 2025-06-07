
import { serve } from 'https://deno.land/std@0.177.1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppWebV4Data {
  instanceId?: string;
  instanceName?: string;
  event?: string;
  data?: any;
  qrCode?: string;
  qr?: string;
  status?: string;
  connectionUpdate?: any;
  messages?: any[];
  timestamp?: string;
}

async function findInstanceByVpsId(supabase: any, vpsInstanceId: string) {
  console.log(`[Webhook V4] 🔍 Buscando instância com vps_instance_id: ${vpsInstanceId}`);
  
  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('vps_instance_id', vpsInstanceId)
    .maybeSingle();
  
  if (instance) {
    console.log(`[Webhook V4] ✅ Instância encontrada: ${instance.instance_name} (ID: ${instance.id})`);
  } else {
    console.log(`[Webhook V4] ❌ Instância não encontrada para vps_instance_id: ${vpsInstanceId}`);
  }
  
  return instance;
}

async function processQRUpdate(supabase: any, webhookData: WhatsAppWebV4Data) {
  console.log('[Webhook V4] 📱 Processando QR Update:', {
    hasInstanceId: !!webhookData.instanceId,
    hasInstanceName: !!webhookData.instanceName,
    hasQrCode: !!(webhookData.qrCode || webhookData.qr || webhookData.data?.qrCode)
  });

  const vpsInstanceId = webhookData.instanceId || webhookData.instanceName;
  if (!vpsInstanceId) {
    console.error('[Webhook V4] ❌ instanceId/instanceName não fornecido');
    return { success: false, error: 'instanceId missing' };
  }

  const instance = await findInstanceByVpsId(supabase, vpsInstanceId);
  if (!instance) {
    console.error('[Webhook V4] ❌ Instância não encontrada:', vpsInstanceId);
    return { success: false, error: 'Instance not found' };
  }

  // Extrair QR code de múltiplas fontes possíveis
  let qrCode = webhookData.qrCode || 
               webhookData.qr || 
               webhookData.data?.qrCode || 
               webhookData.data?.qr ||
               webhookData.data?.base64;
  
  console.log('[Webhook V4] 🔍 QR Code encontrado:', qrCode ? 'SIM' : 'NÃO');
  
  if (qrCode) {
    // Normalizar QR code para data URL format
    if (!qrCode.startsWith('data:image/') && qrCode.length > 100) {
      qrCode = `data:image/png;base64,${qrCode}`;
    }

    console.log('[Webhook V4] 💾 Salvando QR Code no banco...', {
      instanceId: instance.id,
      qrLength: qrCode.length
    });

    // Salvar QR code no banco
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: qrCode,
        web_status: 'waiting_scan',
        connection_status: 'connecting',
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    if (updateError) {
      console.error('[Webhook V4] ❌ Erro ao salvar QR code:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('[Webhook V4] ✅ QR Code salvo com sucesso');
    return { success: true, action: 'qr_saved', instanceName: instance.instance_name };
  }

  console.log('[Webhook V4] ⚠️ QR code não encontrado no webhook data');
  return { success: false, error: 'QR code not found in webhook' };
}

async function processConnectionUpdate(supabase: any, webhookData: WhatsAppWebV4Data) {
  console.log('[Webhook V4] 🔗 Processando Connection Update:', {
    hasInstanceId: !!webhookData.instanceId,
    hasStatus: !!webhookData.status,
    hasConnectionUpdate: !!webhookData.connectionUpdate
  });

  const vpsInstanceId = webhookData.instanceId || webhookData.instanceName;
  if (!vpsInstanceId) {
    console.error('[Webhook V4] ❌ instanceId não fornecido');
    return { success: false, error: 'instanceId missing' };
  }

  const instance = await findInstanceByVpsId(supabase, vpsInstanceId);
  if (!instance) {
    console.error('[Webhook V4] ❌ Instância não encontrada:', vpsInstanceId);
    return { success: false, error: 'Instance not found' };
  }

  // Extrair status de múltiplas fontes
  const connectionData = webhookData.data || webhookData.connectionUpdate || {};
  const newStatus = connectionData.status || 
                   connectionData.state || 
                   connectionData.connection ||
                   webhookData.status;

  console.log('[Webhook V4] 📊 Status detectado:', newStatus);

  if (newStatus) {
    let webStatus = 'connecting';
    let connectionStatus = 'connecting';
    let phone = instance.phone;

    // Mapear status baseado no WhatsApp Web.js
    switch (newStatus.toLowerCase()) {
      case 'open':
      case 'ready':
      case 'connected':
        webStatus = 'ready';
        connectionStatus = 'open';
        // Extrair telefone se disponível
        if (connectionData.user || connectionData.me) {
          const userData = connectionData.user || connectionData.me;
          phone = userData.id || userData.jid || phone;
          if (phone && phone.includes('@')) {
            phone = phone.split('@')[0];
          }
        }
        break;
      case 'close':
      case 'closed':
      case 'disconnected':
        webStatus = 'disconnected';
        connectionStatus = 'disconnected';
        break;
      case 'connecting':
      case 'pairing':
        webStatus = 'connecting';
        connectionStatus = 'connecting';
        break;
    }

    console.log('[Webhook V4] 🔄 Atualizando status:', { webStatus, connectionStatus, phone });

    // Atualizar no banco
    const updateData: any = {
      web_status: webStatus,
      connection_status: connectionStatus,
      updated_at: new Date().toISOString()
    };

    if (phone && phone !== instance.phone) {
      updateData.phone = phone;
    }

    if (connectionStatus === 'open') {
      updateData.date_connected = new Date().toISOString();
      updateData.qr_code = null; // Limpar QR code quando conectar
    } else if (connectionStatus === 'disconnected') {
      updateData.date_disconnected = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', instance.id);

    if (updateError) {
      console.error('[Webhook V4] ❌ Erro ao atualizar status:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('[Webhook V4] ✅ Status atualizado:', {
      instance: instance.instance_name,
      webStatus,
      connectionStatus,
      phone
    });

    return { success: true, action: 'status_updated', newStatus: webStatus };
  }

  console.log('[Webhook V4] ⚠️ Status não encontrado no webhook');
  return { success: false, error: 'Status not found in webhook' };
}

async function processMessageUpdate(supabase: any, webhookData: WhatsAppWebV4Data) {
  console.log('[Webhook V4] 💬 Processando Message Update:', {
    hasInstanceId: !!webhookData.instanceId,
    hasMessages: !!(webhookData.messages || webhookData.data?.messages),
    messageCount: (webhookData.messages || webhookData.data?.messages || []).length
  });
  
  const vpsInstanceId = webhookData.instanceId || webhookData.instanceName;
  if (!vpsInstanceId) {
    return { success: false, error: 'instanceId missing' };
  }

  const instance = await findInstanceByVpsId(supabase, vpsInstanceId);
  if (!instance) {
    return { success: false, error: 'Instance not found' };
  }

  // Processar mensagens
  const messages = webhookData.messages || webhookData.data?.messages || [];
  
  if (messages.length > 0) {
    console.log('[Webhook V4] 📝 Processando', messages.length, 'mensagem(s)');
    
    for (const message of messages) {
      try {
        const remoteJid = message.key?.remoteJid || message.from;
        const fromMe = message.key?.fromMe || false;
        const messageId = message.key?.id || message.id;
        const text = message.message?.conversation || 
                    message.message?.extendedTextMessage?.text || 
                    message.body || 
                    'Mensagem sem texto';

        if (remoteJid) {
          // Extrair número de telefone
          const phone = remoteJid.replace('@c.us', '').replace('@s.whatsapp.net', '');
          
          console.log('[Webhook V4] 📱 Mensagem de:', phone, 'fromMe:', fromMe);
          
          // Criar/encontrar lead
          let leadId = null;
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', phone)
            .eq('whatsapp_number_id', instance.id)
            .maybeSingle();

          if (existingLead) {
            leadId = existingLead.id;
          } else if (!fromMe) {
            // Criar novo lead apenas para mensagens recebidas
            const { data: newLead, error: leadError } = await supabase
              .from('leads')
              .insert({
                phone: phone,
                name: phone, // Nome temporário
                whatsapp_number_id: instance.id,
                company_id: instance.company_id,
                created_by_user_id: instance.created_by_user_id,
                last_message: text,
                last_message_time: new Date().toISOString(),
                unread_count: 1
              })
              .select('id')
              .single();

            if (leadError) {
              console.error('[Webhook V4] ❌ Erro ao criar lead:', leadError);
              continue;
            }
            
            leadId = newLead.id;
            console.log('[Webhook V4] ✅ Novo lead criado:', leadId);
          }

          if (leadId) {
            // Salvar mensagem
            const { error: messageError } = await supabase
              .from('messages')
              .insert({
                lead_id: leadId,
                whatsapp_number_id: instance.id,
                text: text,
                from_me: fromMe,
                external_id: messageId,
                timestamp: new Date().toISOString(),
                status: 'received'
              });

            if (messageError) {
              console.error('[Webhook V4] ❌ Erro ao salvar mensagem:', messageError);
            } else {
              console.log('[Webhook V4] ✅ Mensagem salva');
              
              // Atualizar lead com última mensagem
              if (!fromMe) {
                await supabase
                  .from('leads')
                  .update({
                    last_message: text,
                    last_message_time: new Date().toISOString(),
                    unread_count: supabase.raw('unread_count + 1')
                  })
                  .eq('id', leadId);
              }
            }
          }
        }
      } catch (error) {
        console.error('[Webhook V4] ❌ Erro ao processar mensagem:', error);
      }
    }
  }

  return { success: true, action: 'messages_processed', count: messages.length };
}

serve(async (req) => {
  console.log('[Webhook V4] 📨 WEBHOOK RECEIVED - WhatsApp Web.js v4.0.0');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData: WhatsAppWebV4Data = await req.json();
    console.log('[Webhook V4] 📥 Data received:', JSON.stringify(webhookData, null, 2));

    // Detectar tipo de evento de forma robusta
    let event = webhookData.event;
    
    // Se não tem event explícito, inferir do conteúdo
    if (!event) {
      if (webhookData.qrCode || webhookData.qr || webhookData.data?.qrCode || webhookData.data?.qr) {
        event = 'qr.update';
      } else if (webhookData.status || webhookData.data?.status || webhookData.connectionUpdate) {
        event = 'connection.update';
      } else if (webhookData.data?.messages || webhookData.messages) {
        event = 'messages.upsert';
      } else {
        event = 'unknown';
      }
    }

    console.log('[Webhook V4] 🎯 Event type detected:', event);

    let result;

    switch (event) {
      case 'qr.update':
      case 'qrCode':
      case 'qr':
        result = await processQRUpdate(supabase, webhookData);
        break;
        
      case 'connection.update':
      case 'connectionUpdate':
      case 'status':
        result = await processConnectionUpdate(supabase, webhookData);
        break;
        
      case 'messages.upsert':
      case 'message':
      case 'messages':
        result = await processMessageUpdate(supabase, webhookData);
        break;
        
      default:
        console.log('[Webhook V4] ⚠️ Evento não reconhecido:', event);
        result = { success: true, action: 'ignored', event };
    }

    console.log('[Webhook V4] 📤 Result:', result);

    // Log de sucesso
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'webhook_whatsapp_web_v4',
        status: result.success ? 'success' : 'error',
        result: {
          event,
          action: result.action,
          instanceId: webhookData.instanceId || webhookData.instanceName,
          timestamp: new Date().toISOString()
        },
        error_message: result.success ? null : result.error
      });

    return new Response(
      JSON.stringify({
        success: true,
        processed: result.success,
        action: result.action,
        event,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Webhook V4] ❌ General error:', error);
    
    // Log de erro
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('sync_logs')
        .insert({
          function_name: 'webhook_whatsapp_web_v4',
          status: 'error',
          error_message: error.message,
          result: {
            timestamp: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.error('[Webhook V4] ❌ Erro ao logar:', logError);
    }
    
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
});
