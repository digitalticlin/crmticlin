
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // Log de payload recebido para debug inicial:
    console.log("Webhook Evolution recebido:", JSON.stringify(payload));

    // Futuro: Aqui entra a lógica para salvar mensagem/chat no banco!

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err) {
    console.error("Erro ao processar webhook Evolution:", err);
    return new Response("Webhook error", { status: 400, headers: corsHeaders });
  }
});
