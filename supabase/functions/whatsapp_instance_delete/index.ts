
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
    console.log(`🗑️ [Instance Delete] Deletando instância: ${instanceId}`);

    if (!instanceId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "ID da instância é obrigatório" 
      }), { 
        headers: corsHeaders, 
        status: 400 
      });
    }

    // Buscar instância no banco para obter dados da VPS
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (fetchError || !instance) {
      console.error("❌ [Instance Delete] Instância não encontrada:", fetchError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Instância não encontrada" 
      }), { 
        headers: corsHeaders, 
        status: 404 
      });
    }

    // Deletar da VPS se existe vps_instance_id
    if (instance.vps_instance_id || instance.instance_name) {
      try {
        const vpsUrl = "http://31.97.24.222:3002";
        const instanceName = instance.vps_instance_id || instance.instance_name;
        
        console.log(`🌐 [Instance Delete] Deletando da VPS: ${instanceName}`);
        
        const vpsResponse = await fetch(`${vpsUrl}/instance/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (vpsResponse.ok) {
          console.log(`✅ [Instance Delete] Deletado da VPS: ${instanceName}`);
        } else {
          console.log(`⚠️ [Instance Delete] VPS delete falhou (continuando): ${vpsResponse.status}`);
        }
      } catch (vpsError: any) {
        console.log(`⚠️ [Instance Delete] Erro VPS (continuando): ${vpsError.message}`);
      }
    }

    // Deletar do banco de dados
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      console.error("❌ [Instance Delete] Erro ao deletar do banco:", deleteError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: deleteError.message 
      }), { 
        headers: corsHeaders, 
        status: 500 
      });
    }

    console.log(`✅ [Instance Delete] Instância deletada com sucesso: ${instanceId}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Instância deletada com sucesso"
    }), { headers: corsHeaders });

  } catch (error: any) {
    console.error("❌ [Instance Delete] Erro geral:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Erro interno do servidor" 
    }), { 
      headers: corsHeaders, 
      status: 500 
    });
  }
});
