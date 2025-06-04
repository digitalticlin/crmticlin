
// deno-lint-ignore-file no-explicit-any
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./utils/helpers.ts";
import { processLead } from "./services/leadService.ts";
import { saveMessage } from "./services/messageService.ts";
import { forwardToN8N } from "./services/n8nService.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://kigyebrhfoljnydfipcr.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZ3llYnJoZm9sam55ZGZpcGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDU0OTUsImV4cCI6MjA2MjY4MTQ5NX0.348qSsRPai26TFU87MDv0yE4i_pQmLYMQW9d7n5AN-A";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

  try {
    const payload = await req.json();
    console.log("Webhook Evolution recebido:", JSON.stringify(payload, null, 2).substring(0, 500) + "..."); // Log resumido
    
    if (payload.event === "messages.upsert" && payload.data && payload.data.key) {
      const messageData = payload.data;
      const remoteJid = messageData.key.remoteJid;
      const fromMe = messageData.key.fromMe;
      
      if (remoteJid.includes('@g.us') || fromMe) {
        return new Response(JSON.stringify({ success: true, info: "Ignorado: grupo ou mensagem enviada" }), 
          { headers: corsHeaders });
      }

      const phoneMatch = remoteJid.match(/(\d+)@s\.whatsapp\.net/);
      if (!phoneMatch) {
        console.error("Formato de JID inválido:", remoteJid);
        return new Response(JSON.stringify({ success: false, error: "Formato de JID inválido" }), 
          { headers: corsHeaders, status: 400 });
      }
      
      const phone = phoneMatch[1];
      const instanceName = payload.instance;
      
      if (!instanceName) {
        console.error("Nome da instância ausente no payload");
        return new Response(JSON.stringify({ success: false, error: "Nome da instância ausente" }), 
          { headers: corsHeaders, status: 400 });
      }
      
      // CORRIGIDO: Buscar instância usando evolution_instance_name
      const { data: whatsappInstance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('id, company_id, n8n_webhook_url')
        .eq('evolution_instance_name', instanceName)
        .single();
        
      if (instanceError || !whatsappInstance) {
        console.error("Erro ao buscar instância WhatsApp ou instância não encontrada:", instanceError, "Instância:", instanceName);
        return new Response(JSON.stringify({ success: false, error: "Instância WhatsApp não encontrada ou erro na busca." }), 
          { headers: corsHeaders, status: 404 });
      }
      
      const whatsappInstanceId = whatsappInstance.id;
      const companyId = whatsappInstance.company_id;
      const n8nWebhookUrl = whatsappInstance.n8n_webhook_url;
      
      const { leadId, leadCreated, error: leadProcessingError } = await processLead(
        supabase,
        phone,
        companyId,
        whatsappInstanceId,
        messageData
      );

      if (leadProcessingError || !leadId) {
        return new Response(JSON.stringify({ success: false, error: leadProcessingError || "Falha ao processar lead" }), 
          { headers: corsHeaders, status: 500 });
      }
      
      const { success: messageSaved, error: messageSavingError } = await saveMessage(
        supabase,
        leadId,
        whatsappInstanceId,
        messageData
      );

      if (!messageSaved) {
        // Log o erro mas continua, pois o lead já foi processado.
        console.error("Falha ao salvar mensagem:", messageSavingError);
      }
      
      if (n8nWebhookUrl) {
        await forwardToN8N(n8nWebhookUrl, payload);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          leadCreated: leadCreated,
          leadId: leadId,
          message: leadCreated ? "Novo lead criado e mensagem salva" : "Lead existente atualizado e mensagem salva" 
        }), 
        { headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ success: true, info: "Evento não processado por este webhook" }), { headers: corsHeaders });
  } catch (err) {
    console.error("Erro raiz ao processar webhook Evolution:", err);
    // Se err.response existe, pode ser uma Response já formatada por um service
    if (err.response && err.response instanceof Response) {
        return err.response;
    }
    return new Response(JSON.stringify({ success: false, error: String(err.message || "Erro desconhecido") }), 
      { status: 400, headers: corsHeaders });
  }
});
