import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VPSInstanceInfo {
  instanceId: string; // nome, ex: "digitalticlin"
  status?: string;    // open | connected | connecting | close | disconnected | error
  phone?: string;
  profileName?: string;
}

// Mapear status da VPS para connection_status/web_status internos
function mapStatus(status?: string): { connection: string; web: string } {
  const s = (status || '').toLowerCase();
  if (s === 'open' || s === 'connected' || s === 'ready') {
    return { connection: 'connected', web: 'connected' };
  }
  if (s === 'connecting' || s === 'initializing' || s === 'pending') {
    return { connection: 'connecting', web: 'connecting' };
  }
  if (s === 'close' || s === 'disconnected') {
    return { connection: 'disconnected', web: 'disconnected' };
  }
  return { connection: 'unknown', web: 'unknown' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const vpsUrl = 'http://31.97.163.57:3001';
    const vpsToken = Deno.env.get('VPS_API_TOKEN') || 'bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1';

    // 1) Buscar lista de instâncias na VPS
    const vpsResponse = await fetch(`${vpsUrl}/instances`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${vpsToken}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!vpsResponse.ok) {
      const errText = await vpsResponse.text();
      return new Response(JSON.stringify({ success: false, error: `VPS HTTP ${vpsResponse.status}: ${errText.substring(0, 200)}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const vpsData: { instances?: VPSInstanceInfo[] } = await vpsResponse.json();
    const instances = vpsData.instances || [];

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    // 2) Para cada instância vinda da VPS, atualizar o registro correspondente
    for (const item of instances) {
      try {
        if (!item.instanceId) continue;
        const { connection, web } = mapStatus(item.status);

        // Atualizar por vps_instance_id OU instance_name
        const { error: updErr, data: updData } = await supabase
          .from('whatsapp_instances')
          .update({
            connection_status: connection,
            web_status: web,
            phone: item.phone || null,
            updated_at: new Date().toISOString()
          })
          .or(`vps_instance_id.eq.${item.instanceId},instance_name.eq.${item.instanceId}`)
          .select('id')
          .limit(1);

        if (updErr) {
          errors++;
        } else if (!updData || updData.length === 0) {
          notFound++;
        } else {
          updated++;
        }
      } catch (_e) {
        errors++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      updated,
      notFound,
      errors,
      totalFromVps: instances.length,
      hint: 'Agende esta função a cada 1-2 minutos para manter whatsapp_instances sincronizada'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});


