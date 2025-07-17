import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// CONFIGURAÇÃO VPS CORRIGIDA - PORTA 3001
const VPS_SERVER_URL = 'http://31.97.163.57:3001';
const VPS_AUTH_TOKEN = 'bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1';

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const executionId = `delete_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  console.log(`🗑️ [${executionId}] WHATSAPP INSTANCE DELETE - VPS 3001 CORRIGIDA`);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const { instanceId } = await req.json();
    console.log(`🗑️ [${executionId}] Deletando instância: ${instanceId}`);

    if (!instanceId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "instanceId é obrigatório",
        executionId 
      }), { 
        headers: corsHeaders, 
        status: 400 
      });
    }

    // 1. BUSCAR INSTÂNCIA NO BANCO
    console.log(`🔍 [${executionId}] Buscando instância no banco...`);
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (fetchError || !instance) {
      console.error(`❌ [${executionId}] Instância não encontrada:`, fetchError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Instância não encontrada",
        executionId 
      }), { 
        headers: corsHeaders, 
        status: 404 
      });
    }

    console.log(`✅ [${executionId}] Instância encontrada:`, {
      id: instance.id,
      name: instance.instance_name,
      vps_instance_id: instance.vps_instance_id
    });

    // 2. DELETAR DA VPS (se tiver vps_instance_id)
    let vpsDeleteSuccess = false;
    
    if (instance.vps_instance_id) {
      console.log(`🌐 [${executionId}] Deletando da VPS: ${instance.vps_instance_id}`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        // CORREÇÃO: Endpoint correto conforme server.js
        const vpsEndpoint = `${VPS_SERVER_URL}/instance/${instance.vps_instance_id}`;
        console.log(`🎯 [${executionId}] Endpoint VPS: ${vpsEndpoint}`);
        
        const vpsResponse = await fetch(vpsEndpoint, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPS_AUTH_TOKEN}`
          },
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
            error: errorText,
            endpoint: vpsEndpoint
          });
          // Continuar mesmo se VPS falhar - não é crítico
        }
      } catch (error: any) {
        console.error(`❌ [${executionId}] VPS delete error:`, {
          message: error.message,
          name: error.name,
          endpoint: `${VPS_SERVER_URL}/instance/${instance.vps_instance_id}`
        });
        // Continuar mesmo se VPS falhar - não é crítico
      }
    } else {
      console.log(`⚠️ [${executionId}] Sem vps_instance_id, pulando VPS`);
      vpsDeleteSuccess = true; // Considerar sucesso se não há ID da VPS
    }

    // 3. DELETAR DO BANCO (sempre executar)
    console.log(`🗄️ [${executionId}] Deletando do banco...`);
    
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      console.error(`❌ [${executionId}] Erro ao deletar do banco:`, deleteError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Erro ao deletar do banco: ${deleteError.message}`,
        executionId 
      }), { 
        headers: corsHeaders, 
        status: 500 
      });
    }

    console.log(`✅ [${executionId}] Instância deletada com sucesso do banco`);

    // 4. RESULTADO FINAL - SEMPRE SUCESSO SE DELETOU DO BANCO
    console.log(`🎉 [${executionId}] Deleção concluída:`, {
      success: true,
      vpsDeleteSuccess,
      instanceId,
      instanceName: instance.instance_name
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Instância deletada com sucesso",
      details: {
        instanceId,
        instanceName: instance.instance_name,
        vpsDeleted: vpsDeleteSuccess,
        databaseDeleted: true
      },
      executionId
    }), { 
      headers: corsHeaders,
      status: 200
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
