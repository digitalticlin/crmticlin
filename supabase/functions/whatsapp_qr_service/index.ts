
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CONFIGURAÇÃO VPS REAL - baseada nos dados descobertos
const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 25000,
  endpoints: {
    getQRCode: '/instance/{instanceId}/qr', // GET - Endpoint confirmado funcionando
  }
};

function getVPSHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
    'X-API-Token': VPS_CONFIG.authToken,
    'User-Agent': 'Supabase-WhatsApp-QR-Modular/4.0',
    'Accept': 'application/json'
  };
}

function isRealQRCode(qrCode: string): boolean {
  if (!qrCode || typeof qrCode !== 'string') return false;
  if (qrCode.length < 50) return false;
  
  const validPatterns = [
    qrCode.startsWith('data:image/'),
    qrCode.includes('whatsapp'),
    qrCode.includes('@c.us'),
    /^[A-Za-z0-9+/]+=*$/.test(qrCode) && qrCode.length > 100
  ];
  
  return validPatterns.some(pattern => pattern);
}

function normalizeQRCode(qrCode: string): string {
  if (!qrCode) return '';
  
  if (qrCode.startsWith('data:image/')) {
    return qrCode;
  }
  
  if (/^[A-Za-z0-9+/]+=*$/.test(qrCode)) {
    return `data:image/png;base64,${qrCode}`;
  }
  
  return qrCode;
}

async function makeVPSRequest(endpoint: string, method: string = 'GET', body?: any, retries: number = 2) {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[VPS Request] 🌐 Tentativa ${attempt}/${retries} - ${method} ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeout);
      
      const response = await fetch(url, {
        method,
        headers: getVPSHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log(`[VPS Request] 📊 Status: ${response.status} (tentativa ${attempt})`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[VPS Request] ❌ HTTP Error ${response.status}:`, errorText);
        
        if (attempt === retries) {
          return {
            success: false,
            error: `VPS Error: ${response.status} - ${errorText}`,
            status: response.status
          };
        }
        
        // Aguardar antes do retry
        const delay = 1000 * attempt;
        console.log(`[VPS Request] ⏳ Aguardando ${delay}ms para retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      const responseText = await response.text();
      console.log(`[VPS Request] 📥 Response:`, responseText.substring(0, 200));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.warn(`[VPS Request] ⚠️ Resposta não é JSON:`, responseText);
        data = { success: true, message: responseText };
      }
      
      return {
        success: true,
        data: data
      };
      
    } catch (error: any) {
      console.error(`[VPS Request] ❌ Tentativa ${attempt} falhou:`, error.message);
      
      if (attempt === retries) {
        return {
          success: false,
          error: error.message
        };
      }
      
      const delay = 1000 * attempt;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    success: false,
    error: 'Máximo de tentativas excedido'
  };
}

async function validateUserAndInstance(supabase: any, instanceId: string, userId: string) {
  console.log(`[QR Service] 🔍 Validando instância: ${instanceId} para usuário: ${userId}`);
  
  // Buscar instância por ID ou vps_instance_id
  const { data: instance, error: instanceError } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .or(`id.eq.${instanceId},vps_instance_id.eq.${instanceId}`)
    .eq('created_by_user_id', userId)
    .single();

  if (instanceError || !instance) {
    console.error(`[QR Service] ❌ Instância não encontrada:`, instanceError);
    throw new Error('Instância não encontrada ou sem permissão de acesso');
  }

  console.log(`[QR Service] ✅ Instância validada:`, {
    id: instance.id,
    vpsInstanceId: instance.vps_instance_id,
    instanceName: instance.instance_name,
    connectionStatus: instance.connection_status,
    webStatus: instance.web_status
  });

  return instance;
}

async function checkCachedQRCode(instance: any) {
  const cacheMaxAge = 2 * 60 * 1000; // 2 minutos
  
  if (instance.qr_code && instance.updated_at && isRealQRCode(instance.qr_code)) {
    const qrAge = Date.now() - new Date(instance.updated_at).getTime();
    
    if (qrAge < cacheMaxAge) {
      console.log(`[QR Service] ✅ QR Code do cache válido (${Math.round(qrAge/1000)}s)`);
      return {
        success: true,
        qrCode: instance.qr_code,
        source: 'cache',
        age: Math.round(qrAge/1000)
      };
    } else {
      console.log(`[QR Service] ⏰ QR Code do cache expirado (${Math.round(qrAge/1000)}s)`);
    }
  }
  
  return null;
}

async function fetchQRFromVPS(vpsInstanceId: string) {
  console.log(`[QR Service] 🌐 Buscando QR Code da VPS: ${vpsInstanceId}`);
  
  const endpoint = VPS_CONFIG.endpoints.getQRCode.replace('{instanceId}', vpsInstanceId);
  const result = await makeVPSRequest(endpoint, 'GET');
  
  if (result.success && result.data) {
    const qrCode = result.data.qrCode || result.data.qrcode || result.data.qr_code;
    
    if (qrCode && isRealQRCode(qrCode)) {
      const normalizedQR = normalizeQRCode(qrCode);
      console.log(`[QR Service] ✅ QR Code válido obtido da VPS`);
      
      return {
        success: true,
        qrCode: normalizedQR,
        status: result.data.status
      };
    } else {
      console.log(`[QR Service] ⏳ QR Code ainda não disponível na VPS`);
      return {
        success: false,
        waiting: true,
        status: result.data.status || 'initializing'
      };
    }
  } else {
    console.error(`[QR Service] ❌ Erro ao buscar QR da VPS:`, result.error);
    return {
      success: false,
      error: result.error || 'Falha na comunicação com VPS'
    };
  }
}

async function saveQRToDatabase(supabase: any, instanceId: string, qrCode: string) {
  try {
    console.log(`[QR Service] 💾 Salvando QR Code no banco: ${instanceId}`);
    
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: qrCode,
        web_status: 'waiting_scan',
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    if (error) {
      console.error(`[QR Service] ❌ Erro ao salvar QR no banco:`, error);
      throw new Error(`Erro ao salvar QR Code: ${error.message}`);
    }

    console.log(`[QR Service] ✅ QR Code salvo no banco com sucesso`);
    return true;
  } catch (error: any) {
    console.error(`[QR Service] ❌ Falha ao salvar QR:`, error);
    return false;
  }
}

async function handleGetQRCode(supabase: any, data: any, userId: string) {
  const requestId = `qr_${Date.now()}`;
  console.log(`[QR Service] 📱 GET QR Code [${requestId}]:`, data);

  try {
    const { instanceId } = data;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    // 1. Validar usuário e instância
    const instance = await validateUserAndInstance(supabase, instanceId, userId);
    
    // 2. Verificar cache
    const cachedQR = await checkCachedQRCode(instance);
    if (cachedQR) {
      return {
        success: true,
        qrCode: cachedQR.qrCode,
        source: cachedQR.source,
        instanceName: instance.instance_name,
        cached: true,
        age: cachedQR.age
      };
    }

    // 3. Buscar da VPS
    if (!instance.vps_instance_id) {
      throw new Error('VPS Instance ID não encontrado');
    }

    const vpsResult = await fetchQRFromVPS(instance.vps_instance_id);
    
    if (vpsResult.success && vpsResult.qrCode) {
      // 4. Salvar no banco
      await saveQRToDatabase(supabase, instance.id, vpsResult.qrCode);
      
      return {
        success: true,
        qrCode: vpsResult.qrCode,
        source: 'vps',
        instanceName: instance.instance_name,
        status: vpsResult.status,
        cached: false
      };
    } else {
      return {
        success: false,
        waiting: vpsResult.waiting || false,
        error: vpsResult.error || 'QR Code ainda sendo gerado',
        instanceName: instance.instance_name,
        status: vpsResult.status || 'unknown'
      };
    }

  } catch (error: any) {
    console.error(`[QR Service] ❌ Erro [${requestId}]:`, error);
    return {
      success: false,
      error: error.message,
      requestId
    };
  }
}

async function handleSaveQRCode(supabase: any, data: any, userId: string) {
  console.log(`[QR Service] 💾 SAVE QR Code:`, data);

  try {
    const { instanceId, qrCode } = data;
    
    if (!instanceId || !qrCode) {
      throw new Error('Instance ID e QR Code são obrigatórios');
    }

    // Validar usuário e instância
    const instance = await validateUserAndInstance(supabase, instanceId, userId);
    
    // Validar QR Code
    if (!isRealQRCode(qrCode)) {
      throw new Error('QR Code inválido');
    }

    // Normalizar e salvar
    const normalizedQR = normalizeQRCode(qrCode);
    const saved = await saveQRToDatabase(supabase, instance.id, normalizedQR);
    
    if (saved) {
      return {
        success: true,
        message: 'QR Code salvo com sucesso',
        instanceName: instance.instance_name
      };
    } else {
      throw new Error('Falha ao salvar QR Code no banco');
    }

  } catch (error: any) {
    console.error(`[QR Service] ❌ Erro ao salvar QR:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obter usuário autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { action, ...data } = await req.json();
    console.log(`[QR Service] 🎯 Action: ${action}, User: ${user.id}`);

    let result;

    switch (action) {
      case 'get_qr_code':
      case 'get_qr_corrected_get': // Manter compatibilidade
        result = await handleGetQRCode(supabase, data, user.id);
        break;
        
      case 'save_qr_code':
        result = await handleSaveQRCode(supabase, data, user.id);
        break;
        
      default:
        result = {
          success: false,
          error: `Ação não reconhecida: ${action}`,
          available_actions: ['get_qr_code', 'save_qr_code']
        };
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('[QR Service] ❌ Erro geral:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        service: 'whatsapp_qr_service_modular_v4'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
