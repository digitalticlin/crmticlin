
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const agentId = url.searchParams.get('agent_id');

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'agent_id parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar agente e seu prompt
    const { data: agent, error: agentError } = await supabaseClient
      .from('ai_agents')
      .select(`
        *,
        ai_agent_prompts (*)
      `)
      .eq('id', agentId)
      .eq('status', 'active')
      .single();

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = agent.ai_agent_prompts?.[0];
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Agent prompt not configured' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construir prompt completo para N8N
    const fullPrompt = buildFullPrompt(agent, prompt);

    const responseData = {
      agent_id: agent.id,
      agent_name: agent.name,
      agent_type: agent.type,
      status: agent.status,
      full_prompt: fullPrompt,
      prompt_parts: {
        agent_function: prompt.agent_function,
        communication_style: prompt.communication_style,
        company_info: prompt.company_info,
        product_service_info: prompt.product_service_info,
        prohibitions: prompt.prohibitions,
        objectives: prompt.objectives
      },
      updated_at: prompt.updated_at
    };

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-agent-prompt function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildFullPrompt(agent: any, prompt: any): string {
  const parts = [];

  // Função principal do agente
  if (prompt.agent_function) {
    parts.push(`FUNÇÃO: ${prompt.agent_function}`);
  }

  // Estilo de comunicação
  if (prompt.communication_style) {
    parts.push(`ESTILO DE COMUNICAÇÃO: ${prompt.communication_style}`);
  }

  // Informações da empresa
  if (prompt.company_info) {
    parts.push(`SOBRE A EMPRESA: ${prompt.company_info}`);
  }

  // Informações do produto/serviço
  if (prompt.product_service_info) {
    parts.push(`PRODUTOS/SERVIÇOS: ${prompt.product_service_info}`);
  }

  // Objetivos (passos)
  if (prompt.objectives && prompt.objectives.length > 0) {
    parts.push('OBJETIVOS E FLUXO:');
    prompt.objectives.forEach((objective: string, index: number) => {
      parts.push(`${index + 1}. ${objective}`);
    });
  }

  // Proibições
  if (prompt.prohibitions) {
    parts.push(`PROIBIÇÕES: ${prompt.prohibitions}`);
  }

  return parts.join('\n\n');
}
