
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO: Apenas porta 3002
const VPS_SERVER_URL = 'http://31.97.24.222:3002';
const VPS_AUTH_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestBody = await req.json();
    const { action } = requestBody;

    if (action === 'sync_instances') {
      return await syncInstancesCorrected(supabase);
    }

    throw new Error('Ação não reconhecida');
  } catch (error) {
    console.error('[Instance Monitor] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function syncInstancesCorrected(supabase: any) {
  console.log('[Instance Monitor] 🔄 CORREÇÃO: Sincronizando instâncias usando porta 3002');

  try {
    // 1. Buscar instâncias da VPS
    console.log('[Instance Monitor] 📡 Buscando instâncias na VPS...');
    
    const vpsResponse = await fetch(`${VPS_SERVER_URL}/instances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_AUTH_TOKEN}`
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!vpsResponse.ok) {
      throw new Error(`VPS respondeu com status ${vpsResponse.status}`);
    }

    const vpsData = await vpsResponse.json();
    
    if (!vpsData.success) {
      throw new Error(vpsData.error || 'VPS retornou success: false');
    }

    const vpsInstances = vpsData.instances || [];
    console.log(`[Instance Monitor] ✅ VPS retornou ${vpsInstances.length} instâncias`);

    // 2. Buscar instâncias do banco
    const { data: dbInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('connection_type', 'web');

    if (dbError) {
      throw new Error('Erro ao buscar instâncias do banco');
    }

    // 3. Sincronizar status de cada instância
    let updated = 0;
    let preserved = 0;
    let adopted = 0;
    let errors = 0;

    for (const dbInstance of dbInstances || []) {
      try {
        // Buscar correspondente na VPS
        const vpsInstance = vpsInstances.find((i: any) => 
          i.id === dbInstance.vps_instance_id || 
          i.sessionId === dbInstance.vps_instance_id ||
          i.name === dbInstance.instance_name
        );

        if (vpsInstance) {
          // Atualizar status da instância existente
          const newStatus = mapVpsStatusToDb(vpsInstance.status || 'UNKNOWN');
          
          if (dbInstance.connection_status !== newStatus) {
            const { error: updateError } = await supabase
              .from('whatsapp_instances')
              .update({
                connection_status: newStatus,
                web_status: newStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', dbInstance.id);

            if (updateError) {
              console.error(`[Instance Monitor] ❌ Erro ao atualizar instância ${dbInstance.id}:`, updateError);
              errors++;
            } else {
              updated++;
            }
          } else {
            preserved++;
          }
        } else {
          // Instância não existe mais na VPS, marcar como offline
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({
              connection_status: 'offline',
              web_status: 'disconnected',
              updated_at: new Date().toISOString()
            })
            .eq('id', dbInstance.id);

          if (updateError) {
            errors++;
          } else {
            updated++;
          }
        }
      } catch (instanceError) {
        console.error(`[Instance Monitor] ❌ Erro ao processar instância ${dbInstance.id}:`, instanceError);
        errors++;
      }
    }

    // Buscar instâncias "órfãs" na VPS (presentes na VPS, mas não no banco)
    for (const vpsInstance of vpsInstances) {
      // Verificar se já existe no banco
      const existsInDb = (dbInstances || []).some(
        (db: any) => db.vps_instance_id === vpsInstance.id
      );

      if (!existsInDb) {
        console.log(`[Instance Monitor] 🤔 Instância órfã encontrada na VPS: ${vpsInstance.id}`);
        adopted++;
      }
    }

    console.log(`[Instance Monitor] ✅ Sincronização concluída: ${updated} atualizadas, ${preserved} preservadas, ${adopted} órfãs, ${errors} erros`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        summary: {
          updated,
          preserved,
          adopted,
          errors
        },
        instances: await supabase.from('whatsapp_instances').select('*').eq('connection_type', 'web').then((res: any) => res.data || [])
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Instance Monitor] ❌ Erro na sincronização:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

function mapVpsStatusToDb(vpsStatus: string): string {
  const status = vpsStatus.toLowerCase();
  
  if (status === 'connected' || status === 'open' || status === 'ready') {
    return 'ready';
  }
  
  if (status === 'connecting' || status === 'loading') {
    return 'connecting';
  }
  
  if (status === 'disconnected' || status === 'closed') {
    return 'disconnected';
  }
  
  if (status === 'initializing') {
    return 'initializing';
  }
  
  if (status === 'failed' || status === 'error') {
    return 'error';
  }
  
  if (status === 'pending') {
    return 'vps_pending';
  }
  
  return 'unknown';
}
