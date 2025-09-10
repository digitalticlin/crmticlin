import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuração da VPS (via variáveis de ambiente)
const VPS_CONFIG = {
  baseUrl: Deno.env.get('VPS_BASE_URL')!,
  timeout: 30000 // 30 segundos timeout
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 [Bulk Profile Pic Sync] Iniciando sincronização em massa');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body (opcional - pode receber filtros)
    const requestBody = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const {
      limit = 1000,           // Máximo 1000 leads por execução
      funnel_id,              // Filtro opcional por funil
      instance_id,            // Instância VPS específica (opcional)
      force_update = false    // Forçar atualização mesmo se já tem foto
    } = requestBody;

    console.log('📋 Parâmetros recebidos:', {
      limit,
      funnel_id,
      instance_id,
      force_update
    });

    // 1. 🔍 BUSCAR LEADS ELEGÍVEIS
    let query = supabaseClient
      .from('leads')
      .select('id, name, phone, profile_pic_url, funnel_id, whatsapp_number_id')
      .not('phone', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Aplicar filtros opcionais
    if (funnel_id) {
      query = query.eq('funnel_id', funnel_id);
    }

    if (!force_update) {
      // Apenas leads sem foto de perfil
      query = query.is('profile_pic_url', null);
    }

    const { data: leads, error: leadsError } = await query;

    if (leadsError) {
      throw new Error(`Erro ao buscar leads: ${leadsError.message}`);
    }

    console.log(`📊 Encontrados ${leads?.length || 0} leads para sincronização`);

    if (!leads || leads.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhum lead encontrado para sincronização',
        stats: {
          total_leads: 0,
          processed: 0,
          queued: 0,
          errors: 0
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. 📱 OBTER INSTÂNCIAS WHATSAPP DISPONÍVEIS
    const instancesResponse = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    if (!instancesResponse.ok) {
      throw new Error(`Erro ao obter instâncias VPS: ${instancesResponse.status}`);
    }

    const instancesData = await instancesResponse.json();
    const availableInstances = instancesData.instances?.filter(
      (inst: any) => inst.status === 'connected'
    ) || [];

    console.log(`📱 Instâncias conectadas disponíveis: ${availableInstances.length}`);

    if (availableInstances.length === 0) {
      throw new Error('Nenhuma instância WhatsApp conectada disponível');
    }

    // 3. 🔄 PROCESSAR LEADS EM BATCHES
    const batchSize = 10; // Processar 10 leads por vez
    const results = {
      total_leads: leads.length,
      processed: 0,
      queued: 0,
      errors: 0,
      error_details: [] as string[]
    };

    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      
      console.log(`📦 Processando batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(leads.length / batchSize)}`);

      // Processar batch em paralelo
      const batchPromises = batch.map(async (lead) => {
        try {
          // Determinar qual instância usar
          const targetInstance = instance_id 
            ? availableInstances.find((inst: any) => inst.id === instance_id)
            : availableInstances[Math.floor(Math.random() * availableInstances.length)];

          if (!targetInstance) {
            throw new Error(`Instância não encontrada: ${instance_id || 'random'}`);
          }

          // 4. 🚀 ENVIAR PARA FILA PGMQ (não fazer requisição HTTP direta)
          const { error: queueError } = await supabaseClient.rpc('pgmq_send', {
            queue_name: 'profile_pic_queue',
            msg: {
              lead_id: lead.id,
              phone: lead.phone,
              instance_id: targetInstance.id,
              funnel_id: lead.funnel_id,
              timestamp: new Date().toISOString(),
              retry_count: 0,
              sync_type: 'bulk',
              force_update: force_update
            }
          });

          if (queueError) {
            throw new Error(`Erro ao enfileirar lead ${lead.id}: ${queueError.message}`);
          }

          results.queued++;
          console.log(`✅ Lead ${lead.name || lead.phone} enfileirado com sucesso`);

        } catch (error) {
          results.errors++;
          const errorMsg = `Lead ${lead.id}: ${error.message}`;
          results.error_details.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      });

      // Aguardar conclusão do batch
      await Promise.all(batchPromises);
      results.processed += batch.length;

      // Rate limiting: aguardar entre batches
      if (i + batchSize < leads.length) {
        console.log('⏳ Aguardando 2s antes do próximo batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 5. ⚡ PROCESSAR FILA IMEDIATAMENTE (opcional)
    console.log('🔄 Processando fila imediatamente...');
    const { data: processResult } = await supabaseClient.rpc('process_profile_pic_queue');
    console.log('📊 Resultado do processamento:', processResult);

    // 6. 📊 RETORNAR ESTATÍSTICAS
    const response = {
      success: true,
      message: `Sincronização em massa iniciada para ${results.total_leads} leads`,
      stats: results,
      processing_result: processResult?.[0] || null,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Sincronização em massa concluída:', response.stats);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro na sincronização em massa:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno na sincronização em massa',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});