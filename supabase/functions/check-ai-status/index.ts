
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { leadId, phone } = await req.json()

    if (!leadId && !phone) {
      return new Response(
        JSON.stringify({ 
          error: 'leadId ou phone é obrigatório',
          aiEnabled: false 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('[check-ai-status] 🔍 Consultando status da IA:', { leadId, phone })

    let lead = null;

    // Buscar lead por ID ou telefone
    if (leadId) {
      const { data } = await supabase
        .from('leads')
        .select('kanban_stage_id')
        .eq('id', leadId)
        .single()
      lead = data;
    } else if (phone) {
      const { data } = await supabase
        .from('leads')
        .select('kanban_stage_id')
        .eq('phone', phone)
        .single()
      lead = data;
    }

    if (!lead || !lead.kanban_stage_id) {
      console.log('[check-ai-status] ⚠️ Lead não encontrado ou sem etapa')
      return new Response(
        JSON.stringify({ 
          aiEnabled: true, // Default para leads sem etapa
          message: 'Lead não encontrado ou sem etapa definida'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar status da IA na etapa
    const { data: stage, error } = await supabase
      .from('kanban_stages')
      .select('ai_enabled, title')
      .eq('id', lead.kanban_stage_id)
      .single()

    if (error) {
      console.error('[check-ai-status] ❌ Erro ao buscar etapa:', error)
      throw error
    }

    const aiEnabled = stage?.ai_enabled !== false; // Default true

    console.log('[check-ai-status] ✅ Status consultado:', { 
      stageTitle: stage?.title,
      aiEnabled 
    })

    return new Response(
      JSON.stringify({ 
        aiEnabled,
        stageTitle: stage?.title,
        leadId: leadId || null,
        phone: phone || null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[check-ai-status] ❌ Erro:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        aiEnabled: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
