
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const startTime = Date.now();

  try {
    console.log(`[Main] 🚀 WEBHOOK V5.0 - RLS OTIMIZADO [${requestId}]`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Cliente com privilégios de service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const payload = await req.json();
    console.log(`[Main] 📥 Payload recebido [${requestId}]:`, {
      event: payload.event,
      instanceId: payload.instanceId,
      hasData: !!payload.data,
      hasMessage: !!payload.data?.messages
    });

    // Normalização do payload
    console.log(`[Normalizer] 🔄 Normalizando payload:`, {
      event: payload.event,
      instanceId: payload.instanceId,
      hasData: !!payload.data,
      hasMessage: !!payload.data?.messages
    });

    const normalizeStart = Date.now();
    
    if (!payload.data?.messages || payload.data.messages.length === 0) {
      console.log(`[Normalizer] ⚠️ Sem mensagens para processar`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhuma mensagem para processar'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const message = payload.data.messages[0];
    const normalizeTime = Date.now() - normalizeStart;
    console.log(`[Normalizer] ⏱️ Tempo de normalização: ${normalizeTime}ms`);

    // Processamento principal
    console.log(`[Processor] 🚀 Iniciando processamento V5.0 [${requestId}] - RLS OTIMIZADO`);

    // Análise do telefone
    const remoteJid = message.key.remoteJid;
    const phoneAnalysis = analyzePhone(remoteJid);
    console.log(`[Processor] 📞 Análise do telefone:`, phoneAnalysis);

    if (!phoneAnalysis.valid) {
      console.warn(`[Processor] ⚠️ Telefone inválido rejeitado: ${phoneAnalysis.original}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Número de telefone inválido'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Processor] ✅ Telefone válido confirmado: ${phoneAnalysis.type}`);

    // Buscar instância
    const { data: instance, error: instanceError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('id, created_by_user_id, instance_name')
      .eq('vps_instance_id', payload.instanceId)
      .single();

    if (instanceError || !instance) {
      console.error(`[Processor] ❌ Instância não encontrada:`, instanceError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Instância não encontrada'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Processor] ✅ Instância encontrada: ${instance.id}`);

    // Formatação do telefone
    const formattedPhone = formatPhoneBrazilian(phoneAnalysis.clean);
    console.log(`[Processor] 📞 Telefone formatado: ${formattedPhone.substring(0, 8)}****`);

    // Processamento do lead (buscar ou criar)
    const { data: existingLead } = await supabaseAdmin
      .from('leads')
      .select('id, name')
      .eq('phone', formattedPhone)
      .eq('created_by_user_id', instance.created_by_user_id)
      .single();

    let leadId: string;

    if (existingLead) {
      console.log(`[Processor] 🔄 Lead existente encontrado: ${existingLead.id}`);
      
      // Atualizar lead existente
      await supabaseAdmin
        .from('leads')
        .update({
          whatsapp_number_id: instance.id,
          last_message_time: new Date().toISOString(),
          last_message: getMessageText(message),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLead.id);

      console.log(`[Processor] ✅ Lead atualizado: ${existingLead.id}`);
      leadId = existingLead.id;
    } else {
      console.log(`[Processor] 🆕 Criando novo lead`);

      // Buscar funil e estágio padrão
      const { data: funnel } = await supabaseAdmin
        .from('funnels')
        .select('id')
        .eq('created_by_user_id', instance.created_by_user_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      const { data: stage } = await supabaseAdmin
        .from('kanban_stages')
        .select('id')
        .eq('funnel_id', funnel?.id)
        .order('order_position', { ascending: true })
        .limit(1)
        .single();

      const contactName = getContactName(message) || `Contato ${formattedPhone}`;

      const { data: newLead, error: leadError } = await supabaseAdmin
        .from('leads')
        .insert({
          phone: formattedPhone,
          name: contactName,
          whatsapp_number_id: instance.id,
          created_by_user_id: instance.created_by_user_id,
          funnel_id: funnel?.id,
          kanban_stage_id: stage?.id,
          last_message_time: new Date().toISOString(),
          last_message: getMessageText(message),
          import_source: 'realtime'
        })
        .select('id')
        .single();

      if (leadError) {
        console.error(`[Processor] ❌ Erro ao criar lead:`, leadError);
        throw leadError;
      }

      console.log(`[Processor] ✅ Novo lead criado: ${newLead.id}`);
      leadId = newLead.id;
    }

    // Inserção da mensagem com RLS otimizado
    console.log(`[Processor] 💬 Inserindo mensagem V5.0 para lead: ${leadId}`);

    const messageText = getMessageText(message);
    const fromMe = message.key.fromMe || false;
    const externalId = message.key.id;

    const { data: insertedMessage, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        lead_id: leadId,
        whatsapp_number_id: instance.id,
        text: messageText,
        from_me: fromMe,
        timestamp: new Date().toISOString(),
        status: fromMe ? 'sent' : 'received',
        created_by_user_id: instance.created_by_user_id,
        media_type: 'text',
        import_source: 'realtime',
        external_message_id: externalId
      })
      .select('id')
      .single();

    if (messageError) {
      console.error(`[Processor] ❌ Erro ao inserir mensagem:`, messageError);
      throw messageError;
    }

    console.log(`[Processor] ✅ Mensagem inserida com sucesso: ${insertedMessage.id}`);

    // Atualizar contador de não lidas
    if (!fromMe) {
      await supabaseAdmin
        .from('leads')
        .update({
          unread_count: supabaseAdmin.rpc('increment_unread_count', { lead_id: leadId })
        })
        .eq('id', leadId);

      console.log(`[Processor] ✅ Contador de não lidas atualizado`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[Processor] ✅ Processamento V5.0 concluído em: ${totalTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        messageId: insertedMessage.id,
        leadId: leadId,
        instanceId: instance.id,
        processingTime: totalTime
      },
      version: 'V5.0_RLS_OPTIMIZED'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[Main] ❌ Erro crítico V5.0 [${requestId}]:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno do servidor',
      processingTime: totalTime,
      version: 'V5.0_RLS_OPTIMIZED'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Funções auxiliares
function analyzePhone(remoteJid: string) {
  const original = remoteJid || '';
  const clean = original.replace(/[^0-9]/g, '');
  
  let valid = false;
  let type = 'unknown';
  
  if (clean.length >= 10 && clean.length <= 13) {
    if (clean.startsWith('55')) {
      valid = true;
      type = 'brazil';
    } else if (clean.length >= 10) {
      valid = true;
      type = 'generic';
    }
  }
  
  return { original, clean, valid, type, length: clean.length };
}

function formatPhoneBrazilian(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, '');
  
  // Número brasileiro com código do país (55XXXXXXXXXXX)
  if (clean.length === 13 && clean.startsWith('55')) {
    const ddd = clean.substring(2, 4);
    const numero = clean.substring(4);
    
    if (numero.length === 9) {
      return `+55 (${ddd}) ${numero.substring(0, 5)}-${numero.substring(5)}`;
    } else if (numero.length === 8) {
      return `+55 (${ddd}) 9${numero.substring(0, 4)}-${numero.substring(4)}`;
    }
  }
  
  // Número brasileiro sem código do país (XXXXXXXXXXX)
  if (clean.length === 11) {
    const ddd = clean.substring(0, 2);
    const numero = clean.substring(2);
    return `+55 (${ddd}) ${numero.substring(0, 5)}-${numero.substring(5)}`;
  }
  
  // Número brasileiro sem código do país e sem nono dígito (XXXXXXXXXX)
  if (clean.length === 10) {
    const ddd = clean.substring(0, 2);
    const numero = clean.substring(2);
    return `+55 (${ddd}) 9${numero.substring(0, 4)}-${numero.substring(4)}`;
  }
  
  // Fallback: retornar com prefixo +55
  return `+55 ${clean}`;
}

function getMessageText(message: any): string {
  if (message.message?.conversation) {
    return message.message.conversation;
  }
  
  if (message.message?.extendedTextMessage?.text) {
    return message.message.extendedTextMessage.text;
  }
  
  if (message.message?.imageMessage?.caption) {
    return message.message.imageMessage.caption;
  }
  
  return 'Mensagem sem texto';
}

function getContactName(message: any): string | null {
  if (message.pushName) {
    return message.pushName;
  }
  
  if (message.key?.remoteJid) {
    const phone = message.key.remoteJid;
    return `Contato ${phone}`;
  }
  
  return null;
}
