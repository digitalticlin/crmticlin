
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 30000
};

interface SendMessageRequest {
  instanceId: string;
  phone: string;
  message: string;
  mediaUrl?: string;
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document';
}

interface WebhookData {
  instanceId?: string;
  instanceName?: string;
  event?: string;
  data?: any;
  messages?: any[];
  timestamp?: string;
}

function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

function formatPhoneForSending(cleanPhone: string): string {
  let formattedNumber = cleanPhone;
  
  // Adicionar código do país se necessário
  if (!formattedNumber.startsWith('55')) {
    formattedNumber = '55' + formattedNumber;
  }
  
  return formattedNumber;
}

async function authenticateUser(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { success: false, error: 'No authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { success: false, error: 'Invalid token' };
  }

  return { success: true, user };
}

async function makeVPSRequest(endpoint: string, method: string = 'GET', payload?: any) {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  console.log(`[Messaging Service] ${method} ${url}`);
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`
    },
    signal: AbortSignal.timeout(VPS_CONFIG.timeout)
  };

  if (payload && method !== 'GET') {
    options.body = JSON.stringify(payload);
    console.log(`[Messaging Service] Payload:`, payload);
  }

  const response = await fetch(url, options);
  const responseText = await response.text();
  
  console.log(`[Messaging Service] Response (${response.status}):`, responseText.substring(0, 200));

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = { raw: responseText };
  }

  return { response, data };
}

async function findInstanceByVpsId(supabase: any, vpsInstanceId: string) {
  console.log(`[Messaging Service] 🔍 Buscando instância: ${vpsInstanceId}`);
  
  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('vps_instance_id', vpsInstanceId)
    .maybeSingle();
  
  if (instance) {
    console.log(`[Messaging Service] ✅ Instância encontrada: ${instance.instance_name}`);
  } else {
    console.log(`[Messaging Service] ❌ Instância não encontrada: ${vpsInstanceId}`);
  }
  
  return instance;
}

async function getOrCreateLead(supabase: any, whatsappNumberId: string, phone: string, companyId?: string): Promise<string> {
  const cleanPhone = cleanPhoneNumber(phone);
  
  console.log(`[Messaging Service] 🔍 Buscando/criando lead:`, {
    whatsappNumberId,
    cleanPhone,
    companyId
  });
  
  // Buscar lead existente
  const { data: existingLead } = await supabase
    .from('leads')
    .select('id')
    .eq('phone', cleanPhone)
    .eq('whatsapp_number_id', whatsappNumberId)
    .single();

  if (existingLead) {
    console.log(`[Messaging Service] ✅ Lead existente encontrado:`, existingLead.id);
    return existingLead.id;
  }

  // Criar novo lead
  console.log(`[Messaging Service] 🆕 Criando novo lead`);
  const { data: newLead, error } = await supabase
    .from('leads')
    .insert({
      phone: cleanPhone,
      name: `Lead-${cleanPhone.substring(cleanPhone.length - 4)}`,
      whatsapp_number_id: whatsappNumberId,
      company_id: companyId,
      last_message: 'Conversa iniciada',
      last_message_time: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error || !newLead) {
    console.error(`[Messaging Service] ❌ Erro ao criar lead:`, error);
    throw new Error('Falha ao criar lead');
  }

  console.log(`[Messaging Service] ✅ Novo lead criado:`, newLead.id);
  return newLead.id;
}

async function saveMessage(supabase: any, instanceId: string, leadId: string, messageData: any) {
  console.log(`[Messaging Service] 💾 Salvando mensagem:`, {
    instanceId,
    leadId,
    fromMe: messageData.fromMe,
    mediaType: messageData.mediaType || 'text'
  });

  const { error } = await supabase.from('messages').insert({
    whatsapp_number_id: instanceId,
    lead_id: leadId,
    text: messageData.text || messageData.message,
    from_me: messageData.fromMe || false,
    status: messageData.status || (messageData.fromMe ? 'sent' : 'received'),
    external_id: messageData.messageId || messageData.id || `webhook_${Date.now()}`,
    media_type: messageData.mediaType || 'text',
    media_url: messageData.mediaUrl,
    timestamp: messageData.timestamp || new Date().toISOString()
  });

  if (error) {
    console.error(`[Messaging Service] ❌ Erro ao salvar mensagem:`, error);
  } else {
    console.log(`[Messaging Service] ✅ Mensagem salva com sucesso`);
  }
}

async function updateLeadInfo(supabase: any, leadId: string, message: string) {
  await supabase
    .from('leads')
    .update({
      last_message: message,
      last_message_time: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', leadId);
}

async function processWebhookMessage(supabase: any, webhookData: WebhookData) {
  console.log(`[Messaging Service] 📨 Processando webhook:`, {
    event: webhookData.event,
    hasMessages: !!(webhookData.messages && webhookData.messages.length > 0),
    instanceId: webhookData.instanceId || webhookData.instanceName
  });

  const vpsInstanceId = webhookData.instanceId || webhookData.instanceName;
  if (!vpsInstanceId) {
    console.error(`[Messaging Service] ❌ instanceId não fornecido no webhook`);
    return { success: false, error: 'instanceId missing' };
  }

  const instance = await findInstanceByVpsId(supabase, vpsInstanceId);
  if (!instance) {
    console.error(`[Messaging Service] ❌ Instância não encontrada:`, vpsInstanceId);
    return { success: false, error: 'Instance not found' };
  }

  // Processar mensagens recebidas
  if (webhookData.messages && webhookData.messages.length > 0) {
    console.log(`[Messaging Service] 📬 Processando ${webhookData.messages.length} mensagens`);
    
    for (const message of webhookData.messages) {
      try {
        const phoneNumber = message.from || message.phone || message.remoteJid;
        if (!phoneNumber) {
          console.warn(`[Messaging Service] ⚠️ Mensagem sem número de telefone`);
          continue;
        }

        const cleanPhone = cleanPhoneNumber(phoneNumber.replace('@c.us', ''));
        const leadId = await getOrCreateLead(supabase, instance.id, cleanPhone, instance.company_id);
        
        await saveMessage(supabase, instance.id, leadId, {
          text: message.body || message.text || message.message,
          fromMe: message.fromMe || false,
          messageId: message.id,
          mediaType: message.type || 'text',
          mediaUrl: message.mediaUrl,
          status: 'received',
          timestamp: message.timestamp || new Date().toISOString()
        });

        await updateLeadInfo(supabase, leadId, message.body || message.text || 'Nova mensagem');
        
        console.log(`[Messaging Service] ✅ Mensagem processada para lead: ${leadId}`);
      } catch (error: any) {
        console.error(`[Messaging Service] ❌ Erro ao processar mensagem:`, error.message);
      }
    }
  }

  return { success: true, processed: webhookData.messages?.length || 0 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const isWebhook = url.pathname.includes('/webhook') || req.headers.get('x-webhook') === 'true';

    if (isWebhook) {
      // Processar webhook (não requer autenticação)
      console.log(`[Messaging Service] 📡 Webhook recebido`);
      
      const webhookData = await req.json();
      const result = await processWebhookMessage(supabase, webhookData);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Processar ações que requerem autenticação
      const body = await req.json();
      const { action } = body;

      console.log(`[Messaging Service] 🎯 Ação: ${action}`);

      // Autenticar usuário
      const authResult = await authenticateUser(req, supabase);
      if (!authResult.success) {
        return new Response(
          JSON.stringify({ success: false, error: authResult.error }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { user } = authResult;

      switch (action) {
        case 'send_message': {
          const { instanceId, phone, message, mediaUrl, mediaType }: SendMessageRequest = body;
          
          if (!instanceId || !phone || !message) {
            return new Response(
              JSON.stringify({ success: false, error: 'Parâmetros obrigatórios: instanceId, phone, message' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log(`[Messaging Service] 📤 Enviando mensagem:`, {
            instanceId,
            phone,
            messageLength: message.length,
            mediaType
          });

          // Buscar instância
          const { data: instance, error: instanceError } = await supabase
            .from('whatsapp_instances')
            .select('*')
            .eq('id', instanceId)
            .eq('created_by_user_id', user.id)
            .single();

          if (instanceError || !instance) {
            return new Response(
              JSON.stringify({ success: false, error: 'Instância não encontrada' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (!['ready', 'open'].includes(instance.connection_status)) {
            return new Response(
              JSON.stringify({ success: false, error: `Instância não está conectada. Status: ${instance.connection_status}` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Enviar via VPS
          const cleanPhone = cleanPhoneNumber(phone);
          const formattedPhone = formatPhoneForSending(cleanPhone);
          
          const vpsPayload = {
            instanceId: instance.vps_instance_id,
            phone: formattedPhone,
            message: message
          };

          if (mediaUrl && mediaType && mediaType !== 'text') {
            vpsPayload.mediaUrl = mediaUrl;
            vpsPayload.mediaType = mediaType;
          }

          const { response, data } = await makeVPSRequest('/send', 'POST', vpsPayload);

          if (!response.ok) {
            throw new Error(data.error || `VPS returned status ${response.status}`);
          }

          if (!data.success) {
            throw new Error(data.error || 'VPS returned success: false');
          }

          // Salvar mensagem enviada
          const leadId = await getOrCreateLead(supabase, instanceId, cleanPhone, instance.company_id);
          
          await saveMessage(supabase, instanceId, leadId, {
            text: message,
            fromMe: true,
            messageId: data.messageId || `sent_${Date.now()}`,
            mediaType: mediaType || 'text',
            mediaUrl: mediaUrl,
            status: 'sent'
          });

          await updateLeadInfo(supabase, leadId, message);

          console.log(`[Messaging Service] ✅ Mensagem enviada com sucesso`);

          return new Response(
            JSON.stringify({
              success: true,
              messageId: data.messageId,
              leadId: leadId,
              timestamp: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'get_messages': {
          const { leadId, limit = 50 } = body;
          
          if (!leadId) {
            return new Response(
              JSON.stringify({ success: false, error: 'leadId é obrigatório' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('lead_id', leadId)
            .order('timestamp', { ascending: false })
            .limit(limit);

          if (error) {
            throw new Error(error.message);
          }

          return new Response(
            JSON.stringify({ success: true, messages: messages.reverse() }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        default:
          return new Response(
            JSON.stringify({ success: false, error: `Ação não reconhecida: ${action}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    }

  } catch (error: any) {
    console.error('[Messaging Service] ❌ Erro:', error);
    
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
