import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO: Configuração VPS simplificada - APENAS PORTA 3002
const VPS_CONFIG = {
  primaryUrl: 'http://31.97.24.222:3002', // ÚNICA porta funcional
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 3000, // REDUZIDO: 3 segundos (testado via SSH)
  webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
};

serve(async (req) => {
  const startTime = Date.now();
  console.log('[Instance Manager] 🚀 CORREÇÃO: Requisição iniciada:', req.method, `[${startTime}]`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[Instance Manager] ❌ CORREÇÃO: Erro de autenticação:', authError);
      throw new Error('Usuário não autenticado');
    }

    console.log('[Instance Manager] ✅ CORREÇÃO: Usuário autenticado:', user.id, `[${Date.now() - startTime}ms]`);

    const { action, instanceName, instanceId } = await req.json();

    if (action === 'create_instance') {
      return await createInstanceCorrected(supabase, instanceName, user, startTime);
    }

    if (action === 'delete_instance_corrected') {
      return await deleteInstanceCorrected(supabase, instanceId, user);
    }

    if (action === 'sync_instance_status') {
      return await syncInstanceStatus(supabase, instanceId, user);
    }

    if (action === 'check_vps_status') {
      return await checkVPSStatus(supabase, instanceId, user);
    }

    throw new Error('Ação não reconhecida');

  } catch (error) {
    console.error('[Instance Manager] ❌ CORREÇÃO: Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function createInstanceCorrected(supabase: any, instanceName: string, user: any, startTime: number) {
  const creationId = `corrected_${Date.now()}`;
  console.log(`[Instance Manager] 🎯 CORREÇÃO: Criação simplificada [${creationId}]:`, instanceName, `[${Date.now() - startTime}ms]`);

  try {
    // 1. Validação rápida
    if (!instanceName || instanceName.trim().length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const sanitizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const sessionName = `${sanitizedName}_${timestamp}`;
    const vpsInstanceId = sessionName;

    console.log(`[Instance Manager] 📋 CORREÇÃO: Payload simplificado [${creationId}]:`, vpsInstanceId, `[${Date.now() - startTime}ms]`);

    // 2. PAYLOAD CORRIGIDO - apenas 3 campos essenciais (testado via SSH)
    const vpsPayload = {
      instanceId: vpsInstanceId,
      sessionName: sessionName,
      webhookUrl: VPS_CONFIG.webhookUrl
    };

    // 3. ENVIAR PARA VPS - porta 3002 APENAS (sem fallback)
    console.log(`[Instance Manager] 📡 CORREÇÃO: Enviando para VPS 3002 [${creationId}]:`, `[${Date.now() - startTime}ms]`);
    
    const vpsResult = await sendToVPSCorrected(vpsPayload, creationId, startTime);
    
    if (!vpsResult.success) {
      console.error(`[Instance Manager] ❌ CORREÇÃO: VPS falhou [${creationId}]:`, vpsResult.error, `[${Date.now() - startTime}ms]`);
      throw new Error(`VPS falhou: ${vpsResult.error}`);
    }

    console.log(`[Instance Manager] ✅ CORREÇÃO: VPS sucesso [${creationId}]:`, `[${Date.now() - startTime}ms]`);

    // 4. Salvar no banco (apenas após VPS confirmar)
    const instanceRecord = {
      instance_name: sanitizedName,
      vps_instance_id: vpsInstanceId,
      connection_type: 'web',
      connection_status: 'waiting_qr',
      created_by_user_id: user.id,
      server_url: VPS_CONFIG.primaryUrl,
      company_id: null
    };

    console.log(`[Instance Manager] 💾 CORREÇÃO: Salvando no banco [${creationId}]:`, `[${Date.now() - startTime}ms]`);
    
    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceRecord)
      .select()
      .single();

    if (dbError) {
      console.error(`[Instance Manager] ❌ CORREÇÃO: Erro no banco [${creationId}]:`, dbError, `[${Date.now() - startTime}ms]`);
      throw new Error(`Erro no banco: ${dbError.message}`);
    }

    console.log(`[Instance Manager] ✅ CORREÇÃO: Instância completa [${creationId}]:`, instance.id, `[${Date.now() - startTime}ms]`);

    return new Response(JSON.stringify({
      success: true,
      instance: instance,
      vpsInstanceId: vpsInstanceId,
      corrected: true,
      creationId,
      totalTime: Date.now() - startTime,
      vpsResponse: vpsResult.data,
      message: 'Instância criada com sucesso - versão corrigida'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO: Erro geral [${creationId}]:`, error, `[${Date.now() - startTime}ms]`);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      creationId,
      totalTime: Date.now() - startTime,
      corrected: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function sendToVPSCorrected(payload: any, creationId: string, startTime: number) {
  try {
    const requestStart = Date.now();
    console.log(`[Instance Manager] 📤 CORREÇÃO: Request para 3002 [${creationId}] [${Date.now() - startTime}ms]`);
    
    // TIMEOUT REDUZIDO: 3 segundos (testado via SSH)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[Instance Manager] ⏰ CORREÇÃO: Timeout 3s para 3002 [${creationId}] [${Date.now() - startTime}ms]`);
      controller.abort();
    }, VPS_CONFIG.timeout);
    
    const response = await fetch(`${VPS_CONFIG.primaryUrl}/instance/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const requestTime = Date.now() - requestStart;
    console.log(`[Instance Manager] 📥 CORREÇÃO: Response ${response.status} em ${requestTime}ms [${creationId}] [${Date.now() - startTime}ms]`);

    if (response.ok) {
      const data = await response.json();
      console.log(`[Instance Manager] ✅ CORREÇÃO: Sucesso VPS [${creationId}]:`, data);
      return { success: true, data };
    } else if (response.status === 409) {
      // Instância já existe - considerar sucesso
      console.log(`[Instance Manager] ⚠️ CORREÇÃO: Instância já existe [${creationId}]`);
      return { 
        success: true, 
        data: { 
          message: 'Instance already exists',
          instanceId: payload.instanceId 
        } 
      };
    } else {
      const errorText = await response.text();
      console.error(`[Instance Manager] ❌ CORREÇÃO: HTTP ${response.status} [${creationId}]:`, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO: Erro VPS [${creationId}]:`, error.message, `[${Date.now() - startTime}ms]`);
    return { success: false, error: error.message };
  }
}

async function syncInstanceStatus(supabase: any, instanceId: string, user: any) {
  try {
    console.log(`[Instance Manager] 🔄 SYNC: Sincronizando status para ${instanceId}`);
    
    // Buscar instância no banco
    const { data: instance, error: findError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (findError || !instance?.vps_instance_id) {
      throw new Error('Instância não encontrada');
    }

    // Verificar status real na VPS
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${VPS_CONFIG.primaryUrl}/instance/${instance.vps_instance_id}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const vpsStatus = await response.json();
      console.log(`[Instance Manager] ✅ SYNC: Status VPS obtido:`, vpsStatus);
      
      // Mapear status
      const statusMapping = {
        'ready': 'ready',
        'connected': 'ready', 
        'open': 'ready',
        'connecting': 'connecting',
        'waiting_qr': 'waiting_qr',
        'disconnected': 'disconnected',
        'error': 'error'
      };

      const newStatus = statusMapping[vpsStatus.status] || 'unknown';
      
      // Atualizar no banco
      const updateData: any = {
        connection_status: newStatus,
        web_status: vpsStatus.status,
        updated_at: new Date().toISOString()
      };

      if (vpsStatus.phone) updateData.phone = vpsStatus.phone;
      if (vpsStatus.profileName) updateData.profile_name = vpsStatus.profileName;

      await supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('id', instanceId);

      return new Response(JSON.stringify({
        success: true,
        status: newStatus,
        vps_status: vpsStatus,
        updated: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error(`VPS retornou status ${response.status}`);
    }

  } catch (error) {
    console.error(`[Instance Manager] ❌ SYNC: Erro:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function checkVPSStatus(supabase: any, instanceId: string, user: any) {
  try {
    console.log(`[Instance Manager] 🔍 CHECK: Verificando VPS para ${instanceId}`);
    
    // Buscar instância
    const { data: instance, error: findError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (findError || !instance?.vps_instance_id) {
      throw new Error('Instância não encontrada');
    }

    // Verificar na VPS
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${VPS_CONFIG.primaryUrl}/instance/${instance.vps_instance_id}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    return new Response(JSON.stringify({
      success: response.ok,
      exists_in_vps: response.ok,
      vps_response_status: response.status,
      instance_id: instanceId,
      vps_instance_id: instance.vps_instance_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ CHECK: Erro:`, error);
    return new Response(JSON.stringify({
      success: false,
      exists_in_vps: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function deleteInstanceCorrected(supabase: any, instanceId: string, user: any) {
  console.log(`[Instance Manager] 🗑️ Deletando instância: ${instanceId} para usuário: ${user.id}`);

  try {
    // 1. Buscar instância do usuário específico
    const { data: instance, error: findError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (findError || !instance) {
      throw new Error('Instância não encontrada ou você não tem permissão para deletá-la');
    }

    // 2. Deletar da VPS COM TOKEN se tiver vps_instance_id
    if (instance.vps_instance_id) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const deleteResponse = await fetch(`${VPS_CONFIG.primaryUrl}/instance/${instance.vps_instance_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${VPS_CONFIG.authToken}`
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log(`[Instance Manager] 📡 Delete VPS status:`, deleteResponse.status);
      } catch (vpsError) {
        console.log(`[Instance Manager] ⚠️ Erro ao deletar da VPS (continuando):`, vpsError.message);
      }
    }

    // 3. Deletar do banco
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id);

    if (deleteError) {
      throw new Error(`Erro ao deletar do banco: ${deleteError.message}`);
    }

    console.log(`[Instance Manager] ✅ Instância deletada com sucesso`);

    return new Response(JSON.stringify({
      success: true,
      corrected: true,
      message: 'Instância deletada com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro ao deletar:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
