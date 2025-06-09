
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO FINAL: Configuração VPS com descoberta automática de porta
const VPS_DISCOVERY_CONFIG = {
  endpoints: [
    'http://31.97.24.222:3002', // Porta principal
    'http://31.97.24.222:3001'  // Porta alternativa
  ],
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 20000, // 20 segundos para QR codes
  retryAttempts: 3,
  retryDelay: 2000
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[QR Service] ❌ Erro de autenticação:', authError);
      throw new Error('Usuário não autenticado');
    }

    console.log('[QR Service] ✅ Usuário autenticado:', user.id);

    const { action, instanceId } = await req.json();
    console.log(`[QR Service] 📥 CORREÇÃO FINAL: Ação ${action} para instância ${instanceId}`);

    // CORREÇÃO FINAL: Implementar TODAS as ações com descoberta automática VPS
    if (action === 'get_qr_code' || action === 'get_qr') {
      return await getQRCodeWithAutoDiscovery(supabase, instanceId);
    }

    if (action === 'refresh_qr_code' || action === 'generate_qr') {
      return await refreshQRCodeWithAutoDiscovery(supabase, instanceId);
    }

    if (action === 'get_qr_with_details') {
      return await getQRCodeWithAutoDiscovery(supabase, instanceId);
    }

    throw new Error(`Ação não reconhecida: ${action}`);

  } catch (error) {
    console.error('[QR Service] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// CORREÇÃO FINAL: Descoberta automática de VPS + busca QR com fallback
async function getQRCodeWithAutoDiscovery(supabase: any, instanceId: string) {
  console.log(`[QR Service] 🔍 CORREÇÃO FINAL: Busca QR com descoberta automática: ${instanceId}`);

  try {
    // 1. Buscar instância no banco
    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (dbError || !instance) {
      throw new Error('Instância não encontrada');
    }

    console.log(`[QR Service] 📱 Instância encontrada:`, {
      id: instance.id,
      vps_instance_id: instance.vps_instance_id,
      status: instance.connection_status,
      hasQR: !!instance.qr_code
    });

    // 2. Se já temos QR Code no banco e está fresh (menos de 2 minutos), retornar
    if (instance.qr_code && instance.connection_status === 'waiting_qr') {
      const updatedAt = new Date(instance.updated_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - updatedAt.getTime()) / 60000;
      
      if (diffMinutes < 2) {
        console.log(`[QR Service] ✅ QR Code fresh no banco (${diffMinutes.toFixed(1)}min)`);
        return new Response(JSON.stringify({
          success: true,
          qrCode: instance.qr_code,
          status: instance.connection_status,
          source: 'database_fresh'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 3. CORREÇÃO FINAL: Descoberta automática de VPS + busca QR
    if (instance.vps_instance_id) {
      const workingEndpoint = await discoverWorkingVPSEndpoint();
      
      if (workingEndpoint) {
        console.log(`[QR Service] 📡 Endpoint VPS encontrado: ${workingEndpoint}`);
        
        const qrResult = await fetchQRFromVPS(workingEndpoint, instance.vps_instance_id);
        
        if (qrResult.success && qrResult.qrCode) {
          console.log(`[QR Service] ✅ QR Code obtido da VPS via descoberta automática`);
          
          // Atualizar banco
          await supabase
            .from('whatsapp_instances')
            .update({ 
              qr_code: qrResult.qrCode,
              connection_status: 'waiting_qr',
              server_url: workingEndpoint,
              updated_at: new Date().toISOString()
            })
            .eq('id', instanceId);

          return new Response(JSON.stringify({
            success: true,
            qrCode: qrResult.qrCode,
            status: 'waiting_qr',
            source: 'vps_auto_discovery',
            vpsEndpoint: workingEndpoint
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          console.log(`[QR Service] ⚠️ VPS encontrada mas QR não disponível:`, qrResult.message);
        }
      } else {
        console.log(`[QR Service] ❌ Nenhum endpoint VPS acessível`);
      }
    }

    // 4. QR Code ainda não disponível - manter status de espera
    console.log(`[QR Service] ⏳ QR Code ainda não disponível - polling continuará`);
    return new Response(JSON.stringify({
      success: false,
      waiting: true,
      status: instance.connection_status,
      message: 'QR Code ainda sendo gerado - polling automático ativo'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[QR Service] ❌ Erro na busca QR:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// CORREÇÃO FINAL: Refresh QR com descoberta automática
async function refreshQRCodeWithAutoDiscovery(supabase: any, instanceId: string) {
  console.log(`[QR Service] 🔄 CORREÇÃO FINAL: Refresh QR com descoberta automática: ${instanceId}`);

  try {
    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (dbError || !instance) {
      throw new Error('Instância não encontrada');
    }

    if (!instance.vps_instance_id) {
      throw new Error('VPS Instance ID não encontrado');
    }

    console.log(`[QR Service] 🔄 Tentando refresh automático para: ${instance.vps_instance_id}`);

    // Descobrir endpoint VPS que funciona
    const workingEndpoint = await discoverWorkingVPSEndpoint();
    
    if (!workingEndpoint) {
      throw new Error('Nenhum endpoint VPS acessível para refresh');
    }

    // Tentar refresh na VPS
    const refreshResult = await refreshQROnVPS(workingEndpoint, instance.vps_instance_id);
    
    if (refreshResult.success && refreshResult.qrCode) {
      // Atualizar banco
      await supabase
        .from('whatsapp_instances')
        .update({ 
          qr_code: refreshResult.qrCode,
          connection_status: 'waiting_qr',
          server_url: workingEndpoint,
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      return new Response(JSON.stringify({
        success: true,
        qrCode: refreshResult.qrCode,
        source: 'vps_refresh_auto_discovery',
        vpsEndpoint: workingEndpoint
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error(`Refresh VPS falhou: ${refreshResult.message}`);

  } catch (error) {
    console.error(`[QR Service] ❌ Erro no refresh automático:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// FUNÇÃO: Descoberta automática de endpoint VPS que funciona
async function discoverWorkingVPSEndpoint(): Promise<string | null> {
  console.log(`[QR Service] 🔍 Descobrindo endpoint VPS que funciona...`);
  
  for (const endpoint of VPS_DISCOVERY_CONFIG.endpoints) {
    try {
      console.log(`[QR Service] 📡 Testando: ${endpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s para discovery
      
      const response = await fetch(`${endpoint}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${VPS_DISCOVERY_CONFIG.authToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-QR-Discovery/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`[QR Service] ✅ Endpoint funcionando: ${endpoint}`);
        return endpoint;
      } else {
        console.log(`[QR Service] ⚠️ Endpoint ${endpoint} respondeu HTTP ${response.status}`);
      }
      
    } catch (error) {
      console.log(`[QR Service] ❌ Endpoint ${endpoint} inacessível:`, error.message);
    }
  }
  
  console.log(`[QR Service] 💥 Nenhum endpoint VPS acessível`);
  return null;
}

// FUNÇÃO: Buscar QR Code de um endpoint VPS específico
async function fetchQRFromVPS(endpoint: string, vpsInstanceId: string) {
  console.log(`[QR Service] 📱 Buscando QR de ${endpoint} para ${vpsInstanceId}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VPS_DISCOVERY_CONFIG.timeout);
    
    const response = await fetch(`${endpoint}/instance/${vpsInstanceId}/qr`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${VPS_DISCOVERY_CONFIG.authToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-QR-Fetch/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: data.success || false,
        qrCode: data.qrCode || data.qr || null,
        message: data.message || 'QR obtido'
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: `HTTP ${response.status}: ${errorText}`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      message: `Erro de rede: ${error.message}`
    };
  }
}

// FUNÇÃO: Refresh QR Code em um endpoint VPS específico
async function refreshQROnVPS(endpoint: string, vpsInstanceId: string) {
  console.log(`[QR Service] 🔄 Refresh QR em ${endpoint} para ${vpsInstanceId}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VPS_DISCOVERY_CONFIG.timeout);
    
    const response = await fetch(`${endpoint}/instance/${vpsInstanceId}/qr/refresh`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${VPS_DISCOVERY_CONFIG.authToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-QR-Refresh/1.0'
      },
      body: JSON.stringify({
        instanceId: vpsInstanceId,
        forceRefresh: true
      })
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: data.success || false,
        qrCode: data.qrCode || data.qr || null,
        message: data.message || 'Refresh realizado'
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: `HTTP ${response.status}: ${errorText}`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      message: `Erro de rede: ${error.message}`
    };
  }
}
