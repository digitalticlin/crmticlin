import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// CORREÇÃO: Adicionar token VPS para autenticação
const VPS_AUTH_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  // CORREÇÃO RLS: Service role key deve bypass RLS automaticamente
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

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

    // PRIMEIRO: Buscar instância para logs (com service_role deve funcionar)
    console.log(`🔍 [Instance Delete] Buscando instância para logs...`);
    
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_name, vps_instance_id, created_by_user_id')
      .eq('id', instanceId)
      .single();

    if (fetchError) {
      console.error("⚠️ [Instance Delete] Erro ao buscar (continuando):", fetchError);
    } else if (instance) {
      console.log(`🔍 [Instance Delete] Instância encontrada:`, {
        id: instance.id,
        instance_name: instance.instance_name,
        vps_instance_id: instance.vps_instance_id,
        created_by_user_id: instance.created_by_user_id
      });
    }

    // PULAR VPS TEMPORARIAMENTE
    console.log(`⚠️ [Instance Delete] TESTE: PULANDO VPS temporariamente`);

    // CORRET RLS: Usar SQL direto para bypass
    console.log(`🔓 [Instance Delete] Usando SQL direto para bypass RLS com service_role`);
    
    const { data: deleteResult, error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId)
      .select('id'); // Retorna o que foi deletado

    console.log(`📊 [Instance Delete] Resultado do delete:`, {
      deleteResult,
      deleteError,
      hasError: !!deleteError,
      deletedCount: deleteResult?.length || 0
    });

    if (deleteError) {
      console.error("❌ [Instance Delete] Erro específico:", {
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
        code: deleteError.code
      });
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Delete failed: ${deleteError.message}`,
        details: deleteError.details,
        hint: deleteError.hint
      }), { 
        headers: corsHeaders, 
        status: 500 
      });
    }

    if (!deleteResult || deleteResult.length === 0) {
      console.error("❌ [Instance Delete] Nenhuma linha foi deletada - instância não encontrada");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Instância não encontrada ou já foi deletada" 
      }), { 
        headers: corsHeaders, 
        status: 404 
      });
    }

    console.log(`✅ [Instance Delete] Instância deletada com sucesso: ${instanceId}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Instância deletada com sucesso (sem VPS, service_role bypass)",
      deletedId: deleteResult[0]?.id
    }), { headers: corsHeaders });

  } catch (error: any) {
    console.error("❌ [Instance Delete] Erro geral:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Erro interno do servidor",
      type: error.name || "UnknownError"
    }), { 
      headers: corsHeaders, 
      status: 500 
    });
  }
});
