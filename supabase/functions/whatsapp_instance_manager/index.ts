import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO: Configuração assíncrona otimizada
const WEBHOOK_SERVER_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
  timeout: 10000, // REDUZIDO: 10 segundos apenas
  healthTimeout: 5000, // REDUZIDO: 5 segundos
  retryAttempts: 2, // NOVO: tentativas de retry
  authToken: Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
};

serve(async (req) => {
  console.log('[Instance Manager] 🚀 ASYNC: Requisição iniciada:', req.method);
  
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
      console.error('[Instance Manager] ❌ ASYNC: Erro de autenticação:', authError);
      throw new Error('Usuário não autenticado');
    }

    console.log('[Instance Manager] ✅ ASYNC: Usuário autenticado:', user.id);

    const { action, instanceName, instanceId } = await req.json();

    if (action === 'create_instance') {
      return await createInstanceAsync(supabase, instanceName, user);
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
    console.error('[Instance Manager] ❌ ASYNC: Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function createInstanceAsync(supabase: any, instanceName: string, user: any) {
  const creationId = `async_create_${Date.now()}`;
  console.log(`[Instance Manager] 🚀 ASYNC: Criação assíncrona [${creationId}]:`, instanceName);

  try {
    // 1. Validação e preparação
    if (!instanceName || instanceName.trim().length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const sanitizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const sessionName = `${sanitizedName}_${Date.now()}`;
    const vpsInstanceId = `${sessionName}`;

    // 2. ESTRATÉGIA ASYNC: Salvar no banco PRIMEIRO (otimista)
    const instanceRecord = {
      instance_name: sanitizedName,
      vps_instance_id: vpsInstanceId,
      connection_type: 'web',
      connection_status: 'initializing',
      created_by_user_id: user.id,
      server_url: WEBHOOK_SERVER_CONFIG.baseUrl,
      company_id: null
    };

    console.log(`[Instance Manager] 💾 ASYNC: Salvando no banco [${creationId}]:`, instanceRecord);
    
    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceRecord)
      .select()
      .single();

    if (dbError) {
      console.error(`[Instance Manager] ❌ ASYNC: Erro no banco [${creationId}]:`, dbError);
      throw new Error(`Erro no banco: ${dbError.message}`);
    }

    console.log(`[Instance Manager] ✅ ASYNC: Instância salva [${creationId}]:`, instance.id);

    // 3. ESTRATÉGIA ASYNC: Tentar criar na VPS com timeout reduzido
    const vpsPayload = {
      instanceId: vpsInstanceId,
      sessionName: sessionName,
      webhookUrl: WEBHOOK_SERVER_CONFIG.webhookUrl,
      companyId: user.id,
      webhook: true,
      webhook_by_events: true,
      webhookEvents: ['messages.upsert', 'qr.update', 'connection.update'],
      qrcode: true,
      markOnlineOnConnect: true
    };

    console.log(`[Instance Manager] 🌐 ASYNC: Tentando VPS [${creationId}] (timeout: ${WEBHOOK_SERVER_CONFIG.timeout}ms)`);
    
    // NOVO: Usar Promise.race para implementar timeout customizado
    const vpsPromise = attemptVPSCreation(vpsPayload, WEBHOOK_SERVER_CONFIG.retryAttempts);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('VPS_TIMEOUT')), WEBHOOK_SERVER_CONFIG.timeout)
    );

    try {
      const vpsResult = await Promise.race([vpsPromise, timeoutPromise]);
      
      if (vpsResult.success) {
        console.log(`[Instance Manager] ✅ ASYNC: VPS sucesso [${creationId}]:`, vpsResult.data);
        
        // Atualizar status para aguardar webhook
        await supabase
          .from('whatsapp_instances')
          .update({ 
            connection_status: 'waiting_qr',
            updated_at: new Date().toISOString()
          })
          .eq('id', instance.id);

        return new Response(JSON.stringify({
          success: true,
          instance: instance,
          vpsInstanceId: vpsInstanceId,
          async_mode: true,
          creation_strategy: 'vps_success',
          creationId,
          message: 'Instância criada com sucesso na VPS - aguardando QR Code'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (vpsError) {
      console.log(`[Instance Manager] ⚠️ ASYNC: VPS falhou [${creationId}]:`, vpsError.message);
      
      // ESTRATÉGIA ASYNC: Continuar mesmo com falha da VPS
      await supabase
        .from('whatsapp_instances')
        .update({ 
          connection_status: 'vps_pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id);

      // Agendar verificação posterior (background task)
      scheduleStatusCheck(supabase, instance.id, vpsInstanceId, 3000);

      return new Response(JSON.stringify({
        success: true,
        instance: instance,
        vpsInstanceId: vpsInstanceId,
        async_mode: true,
        creation_strategy: 'async_pending',
        creationId,
        vps_error: vpsError.message,
        message: 'Instância salva - VPS será verificado em background'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error(`[Instance Manager] ❌ ASYNC: Erro geral [${creationId}]:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      creationId,
      async_mode: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function attemptVPSCreation(payload: any, maxAttempts: number) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Instance Manager] 🔄 ASYNC: Tentativa VPS ${attempt}/${maxAttempts}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s por tentativa
      
      const response = await fetch(`${WEBHOOK_SERVER_CONFIG.baseUrl}/instance/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WEBHOOK_SERVER_CONFIG.authToken}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.log(`[Instance Manager] ⚠️ ASYNC: Tentativa ${attempt} falhou:`, error.message);
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Backoff exponencial: 1s, 2s, 4s...
      const backoff = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
}

async function scheduleStatusCheck(supabase: any, instanceId: string, vpsInstanceId: string, delayMs: number) {
  console.log(`[Instance Manager] ⏰ ASYNC: Agendando verificação para ${instanceId} em ${delayMs}ms`);
  
  // NOVO: Background task para verificar status posteriormente
  setTimeout(async () => {
    try {
      console.log(`[Instance Manager] 🔍 ASYNC: Verificando status background para ${instanceId}`);
      
      // Verificar se instância existe na VPS
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${WEBHOOK_SERVER_CONFIG.baseUrl}/instance/${vpsInstanceId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${WEBHOOK_SERVER_CONFIG.authToken}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const vpsStatus = await response.json();
        console.log(`[Instance Manager] ✅ ASYNC: Status VPS encontrado:`, vpsStatus);
        
        // Atualizar status no banco
        await supabase
          .from('whatsapp_instances')
          .update({ 
            connection_status: 'waiting_qr',
            web_status: vpsStatus.status || 'unknown',
            updated_at: new Date().toISOString()
          })
          .eq('id', instanceId);

      } else {
        console.log(`[Instance Manager] ❌ ASYNC: Status VPS não encontrado para ${vpsInstanceId}`);
      }
    } catch (error) {
      console.error(`[Instance Manager] ❌ ASYNC: Erro na verificação background:`, error);
    }
  }, delayMs);
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
    
    const response = await fetch(`${WEBHOOK_SERVER_CONFIG.baseUrl}/instance/${instance.vps_instance_id}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WEBHOOK_SERVER_CONFIG.authToken}`
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
    
    const response = await fetch(`${WEBHOOK_SERVER_CONFIG.baseUrl}/instance/${instance.vps_instance_id}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WEBHOOK_SERVER_CONFIG.authToken}`
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

        // CORREÇÃO: Incluir token de autenticação na deleção
        const deleteResponse = await fetch(`${WEBHOOK_SERVER_CONFIG.baseUrl}/instance/${instance.vps_instance_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${WEBHOOK_SERVER_CONFIG.authToken}` // NOVO: Sempre incluir token
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log(`[Instance Manager] 📡 Delete VPS COM TOKEN status:`, deleteResponse.status);
      } catch (vpsError) {
        console.log(`[Instance Manager] ⚠️ Erro ao deletar da VPS COM TOKEN (continuando):`, vpsError.message);
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

    console.log(`[Instance Manager] ✅ Instância deletada com sucesso COM TOKEN`);

    return new Response(JSON.stringify({
      success: true,
      auth_configured: true, // NOVO: Confirmar que autenticação está configurada
      message: 'Instância deletada com sucesso COM TOKEN'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro ao deletar COM TOKEN:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
