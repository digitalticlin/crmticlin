import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { lead_id, phone, profile_pic_url, instance_id } = await req.json();

    // Validation
    if (!lead_id || !phone || !profile_pic_url) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: lead_id, phone, profile_pic_url'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`📸 Recebendo foto de perfil - Lead: ${lead_id}, Phone: ${phone}`);

    // 🚀 ENVIAR PARA FILA PGMQ (processamento assíncrono)
    const { error } = await supabaseClient.rpc('pgmq_send', {
      queue_name: 'profile_pic_queue',
      msg: {
        lead_id: lead_id,
        phone: phone,
        profile_pic_url: profile_pic_url,
        instance_id: instance_id || 'unknown',
        timestamp: new Date().toISOString(),
        retry_count: 0,
        sync_type: 'webhook'
      }
    });

    if (error) {
      console.error('❌ Erro ao enfileirar foto do lead:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to queue profile picture processing',
          details: error.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // ⚡ PROCESSAR FILA IMEDIATAMENTE (opcional para resposta rápida)
    const { data: processResult } = await supabaseClient.rpc('process_profile_pic_queue');
    const processed = processResult?.[0] || { processed_count: 0, failed_count: 0 };

    // Log success
    console.log(`✅ Foto de perfil enfileirada com sucesso:`, {
      lead_id,
      phone,
      profile_pic_url: profile_pic_url.substring(0, 100) + '...',
      instance_id,
      processed_immediately: processed.processed_count > 0
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Profile picture queued and processed successfully',
        processing_stats: processed,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro na Edge Function profile_pic_receiver:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});