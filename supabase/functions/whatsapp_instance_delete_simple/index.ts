import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { instanceId } = await req.json();
    console.log(`🗑️ [Instance Delete SIMPLE] Deletando instância: ${instanceId}`);

    if (!instanceId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "ID da instância é obrigatório" 
      }), { 
        headers: corsHeaders, 
        status: 400 
      });
    }

    // Buscar instância no banco para confirmar existência
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_name, vps_instance_id')
      .eq('id', instanceId)
      .single();

    if (fetchError || !instance) {
      console.error("❌ [Instance Delete SIMPLE] Instância não encontrada:", fetchError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Instância não encontrada" 
      }), { 
        headers: corsHeaders, 
        status: 404 
      });
    }

    console.log(`🔍 [Instance Delete SIMPLE] Encontrada instância: ${instance.instance_name}`);

    // PULAR VPS - Deletar apenas do banco de dados para teste
    console.log(`⚠️ [Instance Delete SIMPLE] PULANDO VPS - deletando apenas do Supabase`);

    // Deletar do banco de dados
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      console.error("❌ [Instance Delete SIMPLE] Erro ao deletar do banco:", deleteError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: deleteError.message 
      }), { 
        headers: corsHeaders, 
        status: 500 
      });
    }

    console.log(`✅ [Instance Delete SIMPLE] Instância deletada com sucesso do Supabase: ${instanceId}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Instância deletada com sucesso (apenas Supabase)"
    }), { headers: corsHeaders });

  } catch (error: any) {
    console.error("❌ [Instance Delete SIMPLE] Erro geral:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Erro interno do servidor" 
    }), { 
      headers: corsHeaders, 
      status: 500 
    });
  }
}); 