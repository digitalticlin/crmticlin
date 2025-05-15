
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuração do cliente Supabase para edge function
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://kigyebrhfoljnydfipcr.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZ3llYnJoZm9sam55ZGZpcGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDU0OTUsImV4cCI6MjA2MjY4MTQ5NX0.348qSsRPai26TFU87MDv0yE4i_pQmLYMQW9d7n5AN-A";

// Coluna fixa para novos leads
const ENTRADA_LEADS_ID = "column-new-lead";

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload = await req.json();
    console.log("Webhook Evolution recebido:", JSON.stringify(payload));
    
    // Verificar se é uma mensagem recebida e se tem o formato esperado
    if (payload.event === "messages.upsert" && payload.data && payload.data.key) {
      // Extrair informações da mensagem
      const messageData = payload.data;
      const remoteJid = messageData.key.remoteJid;
      const fromMe = messageData.key.fromMe;
      const messageType = messageData.messageType || "text";
      
      // Se a mensagem for de um grupo ou não for recebida (fromMe=true), ignoramos
      if (remoteJid.includes('@g.us') || fromMe) {
        return new Response(JSON.stringify({ success: true, info: "Ignorado: grupo ou mensagem enviada" }), 
          { headers: corsHeaders });
      }

      // Extrair o número de telefone do remoteJid
      const phoneMatch = remoteJid.match(/(\d+)@s\.whatsapp\.net/);
      if (!phoneMatch) {
        return new Response(JSON.stringify({ success: false, error: "Formato de JID inválido" }), 
          { headers: corsHeaders });
      }
      
      const phone = phoneMatch[1];
      const instanceName = payload.instance;
      
      if (!instanceName) {
        return new Response(JSON.stringify({ success: false, error: "Nome da instância ausente" }), 
          { headers: corsHeaders });
      }
      
      // Encontrar o ID da instância WhatsApp
      const { data: whatsappNumber, error: numberError } = await supabase
        .from('whatsapp_numbers')
        .select('id, company_id')
        .eq('evolution_instance_name', instanceName)
        .single();
        
      if (numberError) {
        console.error("Erro ao buscar instância WhatsApp:", numberError);
        return new Response(JSON.stringify({ success: false, error: "Instância não encontrada" }), 
          { headers: corsHeaders });
      }
      
      const whatsappNumberId = whatsappNumber.id;
      const companyId = whatsappNumber.company_id;
      
      // Verificar se já existe um lead para este número
      const { data: existingLead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('phone', phone)
        .eq('company_id', companyId)
        .maybeSingle();
        
      if (leadError) {
        console.error("Erro ao verificar lead:", leadError);
        return new Response(JSON.stringify({ success: false, error: "Erro ao verificar lead" }), 
          { headers: corsHeaders });
      }
      
      let leadId;
      
      // Se o lead não existe, criar um novo
      if (!existingLead) {
        const pushName = messageData.pushName || null;
        const leadName = pushName ? pushName : `Lead-${phone.substring(phone.length - 4)}`;
        
        // Criar novo lead
        const { data: newLead, error: createLeadError } = await supabase
          .from('leads')
          .insert({
            company_id: companyId,
            whatsapp_number_id: whatsappNumberId,
            name: leadName,
            phone: phone,
            kanban_stage_id: null, // Será atualizado após inserção para o stage de entrada
            last_message: extractTextMessage(messageData),
            last_message_time: new Date().toISOString(),
            unread_count: 1
          })
          .select()
          .single();
          
        if (createLeadError) {
          console.error("Erro ao criar lead:", createLeadError);
          return new Response(JSON.stringify({ success: false, error: "Erro ao criar lead" }), 
            { headers: corsHeaders });
        }
        
        leadId = newLead.id;
        
        // Buscar a etapa de entrada de leads no kanban
        const { data: entryStage, error: stageError } = await supabase
          .from('kanban_stages')
          .select('id')
          .eq('company_id', companyId)
          .eq('is_fixed', true)
          .ilike('title', '%entrada%leads%')
          .single();
        
        // Se não encontrar a etapa de entrada por nome, pegar o primeiro estágio do kanban
        if (stageError) {
          console.log("Etapa de entrada não encontrada pelo nome, buscando o primeiro estágio...");
          const { data: firstStage, error: firstStageError } = await supabase
            .from('kanban_stages')
            .select('id')
            .eq('company_id', companyId)
            .order('order_position', { ascending: true })
            .limit(1)
            .single();
            
          if (!firstStageError && firstStage) {
            // Atualizar o lead com o estágio de kanban encontrado
            await supabase
              .from('leads')
              .update({ kanban_stage_id: firstStage.id })
              .eq('id', leadId);
              
            console.log(`Lead ${leadId} adicionado ao estágio ${firstStage.id}`);
          } else {
            console.error("Não foi possível encontrar nenhum estágio de kanban:", firstStageError);
          }
        } else {
          // Atualizar o lead com o estágio de entrada de leads
          await supabase
            .from('leads')
            .update({ kanban_stage_id: entryStage.id })
            .eq('id', leadId);
            
          console.log(`Lead ${leadId} adicionado à etapa de entrada ${entryStage.id}`);
        }
      } else {
        leadId = existingLead.id;
        
        // Atualizar contagem de mensagens não lidas e última mensagem
        await supabase
          .from('leads')
          .update({
            unread_count: (existingLead.unread_count || 0) + 1,
            last_message: extractTextMessage(messageData),
            last_message_time: new Date().toISOString()
          })
          .eq('id', leadId);
          
        console.log(`Lead ${leadId} existente atualizado`);
      }
      
      // Salvar a mensagem
      const messageText = extractTextMessage(messageData);
      if (messageText) {
        const { data: savedMessage, error: messageError } = await supabase
          .from('messages')
          .insert({
            lead_id: leadId,
            whatsapp_number_id: whatsappNumberId,
            from_me: false,
            text: messageText,
            status: 'received',
            external_id: messageData.key.id
          });
          
        if (messageError) {
          console.error("Erro ao salvar mensagem:", messageError);
        } else {
          console.log("Mensagem salva com sucesso");
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          leadCreated: !existingLead,
          leadId: leadId,
          message: !existingLead ? "Novo lead criado e adicionado ao funil" : "Lead existente atualizado" 
        }), 
        { headers: corsHeaders }
      );
    }

    // Resposta para outros tipos de eventos
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err) {
    console.error("Erro ao processar webhook Evolution:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), 
      { status: 400, headers: corsHeaders });
  }
});

// Função auxiliar para extrair texto da mensagem
function extractTextMessage(messageData: any): string | null {
  if (!messageData.message) return null;
  
  // Verificar diferentes tipos de mensagens
  if (messageData.message.conversation) {
    return messageData.message.conversation;
  } else if (messageData.message.extendedTextMessage && messageData.message.extendedTextMessage.text) {
    return messageData.message.extendedTextMessage.text;
  } else if (messageData.message.imageMessage && messageData.message.imageMessage.caption) {
    return messageData.message.imageMessage.caption;
  } else if (messageData.message.videoMessage && messageData.message.videoMessage.caption) {
    return messageData.message.videoMessage.caption;
  }
  
  return "[Mensagem não suportada]";
}
