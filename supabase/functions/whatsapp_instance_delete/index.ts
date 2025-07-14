import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Configuração VPS
const VPS_SERVER_URL = 'http://31.97.24.222:3002';
const VPS_AUTH_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const executionId = `delete_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  console.log(`🗑️ [${executionId}] WHATSAPP INSTANCE DELETE - Iniciando`);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const { instanceId, vpsInstanceId } = await req.json();
    console.log(`🗑️ [${executionId}] Parâmetros recebidos:`, { instanceId, vpsInstanceId });

    if (!instanceId && !vpsInstanceId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "ID da instância (instanceId ou vpsInstanceId) é obrigatório",
        executionId 
      }), { 
        headers: corsHeaders, 
        status: 400 
      });
    }

    // Buscar instância no banco para obter dados completos
    console.log(`🔍 [${executionId}] Buscando instância no banco...`);
    let instance = null;
    
    if (instanceId) {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .single();
      
      if (error) {
        console.error(`❌ [${executionId}] Erro ao buscar por instanceId:`, error);
      } else {
        instance = data;
      }
    }
    
    // Se não encontrou por instanceId, tentar por vpsInstanceId
    if (!instance && vpsInstanceId) {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('vps_instance_id', vpsInstanceId)
        .single();
      
      if (error) {
        console.error(`❌ [${executionId}] Erro ao buscar por vpsInstanceId:`, error);
      } else {
        instance = data;
      }
    }

    if (instance) {
      console.log(`🔍 [${executionId}] Instância encontrada:`, {
        id: instance.id,
        instance_name: instance.instance_name,
        vps_instance_id: instance.vps_instance_id,
        connection_status: instance.connection_status
      });
    } else {
      console.log(`⚠️ [${executionId}] Instância não encontrada no banco`);
    }

    // 1. DELETAR DA VPS (se tiver vps_instance_id)
    const vpsId = instance?.vps_instance_id || vpsInstanceId;
    let vpsDeleteSuccess = false;
    
    if (vpsId) {
      console.log(`🚀 [${executionId}] Deletando da VPS: ${vpsId}`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const vpsResponse = await fetch(`${VPS_SERVER_URL}/instance/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPS_AUTH_TOKEN}`,
            'X-API-Token': VPS_AUTH_TOKEN
          },
          body: JSON.stringify({
            instanceId: vpsId
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (vpsResponse.ok) {
          const vpsData = await vpsResponse.json();
          console.log(`✅ [${executionId}] VPS delete success:`, vpsData);
          vpsDeleteSuccess = true;
        } else {
          const errorText = await vpsResponse.text();
          console.error(`❌ [${executionId}] VPS delete failed:`, {
            status: vpsResponse.status,
            error: errorText
          });
        }
      } catch (error) {
        console.error(`❌ [${executionId}] VPS delete error:`, error);
      }
    } else {
      console.log(`⚠️ [${executionId}] Sem vps_instance_id, pulando delete da VPS`);
    }

    // 2. DELETAR DO BANCO (se tiver instance)
    let dbDeleteSuccess = false;
    
    if (instance) {
      console.log(`🗄️ [${executionId}] Deletando do banco: ${instance.id}`);
      
      const { data: deleteResult, error: deleteError } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instance.id)
        .select('id');

      if (deleteError) {
        console.error(`❌ [${executionId}] Erro ao deletar do banco:`, deleteError);
      } else if (deleteResult && deleteResult.length > 0) {
        console.log(`✅ [${executionId}] Banco delete success:`, deleteResult);
        dbDeleteSuccess = true;
      } else {
        console.error(`❌ [${executionId}] Nenhuma linha deletada do banco`);
      }
    } else {
      console.log(`⚠️ [${executionId}] Sem instância no banco, pulando delete do banco`);
    }

    // 3. RESULTADO FINAL
    const overallSuccess = (vpsId ? vpsDeleteSuccess : true) && (instance ? dbDeleteSuccess : true);
    
    console.log(`📊 [${executionId}] Resultado final:`, {
      overallSuccess,
      vpsDeleteSuccess,
      dbDeleteSuccess,
      hadVpsId: !!vpsId,
      hadInstance: !!instance
    });

    return new Response(JSON.stringify({
      success: overallSuccess,
      message: overallSuccess ? 
        "Instância deletada com sucesso" : 
        "Falha parcial na deleção",
      details: {
        vps: {
          attempted: !!vpsId,
          success: vpsDeleteSuccess,
          instanceId: vpsId
        },
        database: {
          attempted: !!instance,
          success: dbDeleteSuccess,
          instanceId: instance?.id
        }
      },
      executionId
    }), { 
      headers: corsHeaders,
      status: overallSuccess ? 200 : 500
    });

  } catch (error: any) {
    console.error(`❌ [${executionId}] Erro geral:`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Erro interno do servidor",
      type: error.name || "UnknownError",
      executionId
    }), { 
      headers: corsHeaders, 
      status: 500 
    });
  }
});
