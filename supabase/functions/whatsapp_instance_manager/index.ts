import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO CRÍTICA: Configuração VPS baseada nos testes SSH reais
const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 35000, // Aumentado para 35 segundos
  retryAttempts: 3,
  retryDelay: 2000,
  webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
};

serve(async (req) => {
  console.log('[Instance Manager] 🚀 CORREÇÃO SSH: Requisição iniciada:', req.method);
  
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
      console.error('[Instance Manager] ❌ CORREÇÃO SSH: Erro de autenticação:', authError);
      throw new Error('Usuário não autenticado');
    }

    console.log('[Instance Manager] ✅ CORREÇÃO SSH: Usuário autenticado:', user.id);

    const { action, instanceName, instanceId } = await req.json();

    if (action === 'create_instance') {
      return await createInstanceSSHCorrected(supabase, instanceName, user);
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
    console.error('[Instance Manager] ❌ CORREÇÃO SSH: Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function createInstanceSSHCorrected(supabase: any, instanceName: string, user: any) {
  const creationId = `ssh_corrected_${Date.now()}`;
  console.log(`[Instance Manager] 🎯 CORREÇÃO SSH: Criação baseada em teste SSH [${creationId}]:`, instanceName);

  try {
    // 1. Validação e preparação
    if (!instanceName || instanceName.trim().length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const sanitizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const sessionName = `${sanitizedName}_${timestamp}`;
    const vpsInstanceId = sessionName; // CORREÇÃO: instanceId igual sessionName

    // 2. Salvar no banco PRIMEIRO
    const instanceRecord = {
      instance_name: sanitizedName,
      vps_instance_id: vpsInstanceId,
      connection_type: 'web',
      connection_status: 'initializing',
      created_by_user_id: user.id,
      server_url: VPS_CONFIG.baseUrl,
      company_id: null
    };

    console.log(`[Instance Manager] 💾 CORREÇÃO SSH: Salvando no banco [${creationId}]:`, instanceRecord);
    
    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceRecord)
      .select()
      .single();

    if (dbError) {
      console.error(`[Instance Manager] ❌ CORREÇÃO SSH: Erro no banco [${creationId}]:`, dbError);
      throw new Error(`Erro no banco: ${dbError.message}`);
    }

    console.log(`[Instance Manager] ✅ CORREÇÃO SSH: Instância salva [${creationId}]:`, instance.id);

    // 3. PAYLOAD EXATO DO TESTE SSH
    const sshPayload = {
      instanceId: vpsInstanceId,
      sessionName: sessionName,
      webhookUrl: VPS_CONFIG.webhookUrl,
      companyId: user.id,
      webhook: true,
      webhook_by_events: true,
      webhookEvents: ["messages.upsert", "qr.update", "connection.update"],
      qrcode: true,
      markOnlineOnConnect: true
    };

    console.log(`[Instance Manager] 📡 CORREÇÃO SSH: Enviando payload SSH [${creationId}]:`, sshPayload);
    
    // 4. Fazer requisição com retry baseado no teste SSH
    const vpsResult = await attemptVPSCreationSSH(sshPayload, VPS_CONFIG.retryAttempts, creationId);
    
    if (vpsResult.success) {
      console.log(`[Instance Manager] ✅ CORREÇÃO SSH: VPS sucesso [${creationId}]:`, vpsResult.data);
      
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
        sshCorrected: true,
        creationId,
        vpsResponse: vpsResult.data,
        message: 'Instância criada com payload SSH correto - aguardando QR Code'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error(`VPS falhou com payload SSH: ${vpsResult.error}`);
    }

  } catch (error) {
    console.error(`[Instance Manager] ❌ CORREÇÃO SSH: Erro geral [${creationId}]:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      creationId,
      sshCorrected: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function attemptVPSCreationSSH(payload: any, maxAttempts: number, creationId: string) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Instance Manager] 🔄 CORREÇÃO SSH: Tentativa VPS ${attempt}/${maxAttempts} [${creationId}]`);
      console.log(`[Instance Manager] 📋 CORREÇÃO SSH: Payload SSH sendo enviado:`, JSON.stringify(payload, null, 2));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeout);
      
      const response = await fetch(`${VPS_CONFIG.baseUrl}/instance/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`[Instance Manager] 📥 CORREÇÃO SSH: Response status [${creationId}]:`, response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(`[Instance Manager] ✅ CORREÇÃO SSH: Response data [${creationId}]:`, data);
        return { success: true, data };
      } else {
        const errorText = await response.text();
        console.error(`[Instance Manager] ❌ CORREÇÃO SSH: HTTP ${response.status} [${creationId}]:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error(`[Instance Manager] ⚠️ CORREÇÃO SSH: Tentativa ${attempt} falhou [${creationId}]:`, error.message);
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Delay entre tentativas
      const backoff = VPS_CONFIG.retryDelay * attempt;
      console.log(`[Instance Manager] ⏳ CORREÇÃO SSH: Aguardando ${backoff}ms antes da próxima tentativa [${creationId}]`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
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
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/instance/${instance.vps_instance_id}/status`, {
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
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/instance/${instance.vps_instance_id}/status`, {
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

        const deleteResponse = await fetch(`${VPS_CONFIG.baseUrl}/instance/${instance.vps_instance_id}`, {
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
      sshCorrected: true,
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
