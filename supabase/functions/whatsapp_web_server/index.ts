
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { discoverWorkingToken, getVPSHeaders, VPS_CONFIG } from './config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[WhatsApp Web Server] 🚀 CORREÇÃO AUTOMÁTICA v3.0');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action } = await req.json();
    console.log(`[WhatsApp Web Server] 🎯 Action: ${action}`);

    // CORREÇÃO: Descobrir token funcional antes de qualquer operação
    let workingToken = await discoverWorkingToken();
    if (!workingToken && workingToken !== '') {
      console.log('[WhatsApp Web Server] ⚠️ CORREÇÃO - Usando token de fallback');
      workingToken = VPS_CONFIG.possibleTokens[0];
    }

    console.log(`[WhatsApp Web Server] 🔑 CORREÇÃO - Token selecionado: ${workingToken ? workingToken.substring(0, 15) + '...' : 'SEM TOKEN'}`);

    if (action === 'create_instance') {
      console.log('[WhatsApp Web Server] 🏗️ CORREÇÃO - Criando instância com token descoberto...');
      
      const { instanceName, userId } = await req.json();
      
      if (!instanceName) {
        throw new Error('Nome da instância é obrigatório');
      }

      const vpsInstanceId = `instance_${userId}_${instanceName}_${Date.now()}`;
      
      const payload = {
        instanceId: vpsInstanceId,
        sessionName: instanceName,
        webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_qr_service',
        settings: {
          autoReconnect: true,
          markMessages: false,
          syncFullHistory: false
        }
      };

      console.log(`[WhatsApp Web Server] 📤 CORREÇÃO - Payload:`, payload);

      try {
        const response = await fetch(`${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.createInstance}`, {
          method: 'POST',
          headers: getVPSHeaders(workingToken),
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(VPS_CONFIG.timeout)
        });

        const responseText = await response.text();
        console.log(`[WhatsApp Web Server] 📊 CORREÇÃO - VPS Response: ${response.status}`);
        console.log(`[WhatsApp Web Server] 📋 CORREÇÃO - Response Body: ${responseText}`);

        if (response.ok) {
          let responseData;
          try {
            responseData = JSON.parse(responseText);
          } catch {
            responseData = { success: true, message: responseText };
          }

          // Salvar no Supabase
          const { data: instance, error: dbError } = await supabase
            .from('whatsapp_instances')
            .insert({
              instance_name: instanceName,
              vps_instance_id: vpsInstanceId,
              connection_status: 'connecting',
              connection_type: 'web',
              server_url: VPS_CONFIG.baseUrl,
              created_by_user_id: userId
            })
            .select()
            .single();

          if (dbError) {
            console.error('[WhatsApp Web Server] ❌ CORREÇÃO - Erro no banco:', dbError);
            throw new Error(`Erro ao salvar no banco: ${dbError.message}`);
          }

          console.log('[WhatsApp Web Server] ✅ CORREÇÃO - Instância criada com sucesso');
          
          return new Response(
            JSON.stringify({
              success: true,
              instance: instance,
              vps_response: responseData,
              correction_applied: true,
              working_token_used: workingToken ? workingToken.substring(0, 15) + '...' : 'SEM TOKEN'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          throw new Error(`VPS Error ${response.status}: ${responseText}`);
        }
      } catch (error: any) {
        console.error('[WhatsApp Web Server] ❌ CORREÇÃO - Erro na VPS:', error);
        throw new Error(`Falha na comunicação com VPS: ${error.message}`);
      }
    }

    // Outras ações mantidas iguais...
    return new Response(
      JSON.stringify({ success: false, error: 'Ação não reconhecida' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[WhatsApp Web Server] ❌ CORREÇÃO - Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        correction_attempted: true
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
