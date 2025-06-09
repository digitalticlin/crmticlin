
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO: Configuração otimizada com timeout adequado baseado nos testes SSH
const WEBHOOK_SERVER_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
  timeout: 30000, // CORREÇÃO: Aumentado para 30 segundos baseado nos testes
  healthTimeout: 15000 // CORREÇÃO: Health check separado com 15s
};

serve(async (req) => {
  console.log('[Instance Manager] 🚀 Iniciando requisição:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // CORREÇÃO: Autenticação simplificada e mais robusta
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[Instance Manager] ❌ Erro de autenticação:', authError);
      throw new Error('Usuário não autenticado');
    }

    console.log('[Instance Manager] ✅ Usuário autenticado:', user.id, user.email);

    const { action, instanceName, instanceId } = await req.json();

    if (action === 'create_instance') {
      return await createInstanceOptimized(supabase, instanceName, user);
    }

    if (action === 'delete_instance_corrected') {
      return await deleteInstanceCorrected(supabase, instanceId, user);
    }

    throw new Error('Ação não reconhecida');

  } catch (error) {
    console.error('[Instance Manager] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function createInstanceOptimized(supabase: any, instanceName: string, user: any) {
  const creationId = `create_${Date.now()}`;
  console.log(`[Instance Manager] 🚀 CORREÇÃO: Criando instância otimizada [${creationId}]:`, instanceName);

  try {
    // 1. Validação básica apenas
    if (!instanceName || instanceName.trim().length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const sanitizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const sessionName = `${sanitizedName}_${Date.now()}`;
    const vpsInstanceId = `${sessionName}`;

    // 2. CORREÇÃO: Criar no banco PRIMEIRO (estratégia otimista)
    const instanceRecord = {
      instance_name: sanitizedName,
      vps_instance_id: vpsInstanceId,
      connection_type: 'web',
      connection_status: 'initializing',
      created_by_user_id: user.id,
      server_url: WEBHOOK_SERVER_CONFIG.baseUrl,
      company_id: null
    };

    console.log(`[Instance Manager] 💾 CORREÇÃO: Salvando no banco primeiro [${creationId}]:`, instanceRecord);
    
    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceRecord)
      .select()
      .single();

    if (dbError) {
      console.error(`[Instance Manager] ❌ Erro no banco [${creationId}]:`, dbError);
      throw new Error(`Erro no banco: ${dbError.message}`);
    }

    console.log(`[Instance Manager] ✅ Instância salva no banco [${creationId}]:`, instance.id);

    // 3. CORREÇÃO: Criar na VPS com estratégia assíncrona (baseado nos testes SSH)
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

    console.log(`[Instance Manager] 🌐 CORREÇÃO: Criando na VPS [${creationId}] (timeout: ${WEBHOOK_SERVER_CONFIG.timeout}ms)`);
    
    const vpsController = new AbortController();
    const vpsTimeoutId = setTimeout(() => vpsController.abort(), WEBHOOK_SERVER_CONFIG.timeout);

    try {
      const vpsResponse = await fetch(`${WEBHOOK_SERVER_CONFIG.baseUrl}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vpsPayload),
        signal: vpsController.signal
      });

      clearTimeout(vpsTimeoutId);

      if (!vpsResponse.ok) {
        const errorText = await vpsResponse.text();
        console.error(`[Instance Manager] ❌ VPS erro [${creationId}]:`, vpsResponse.status, errorText);
        
        // CORREÇÃO: Marcar como erro mas manter no banco para retry
        await supabase
          .from('whatsapp_instances')
          .update({ 
            connection_status: 'error',
            updated_at: new Date().toISOString()
          })
          .eq('id', instance.id);
          
        throw new Error(`VPS respondeu com status ${vpsResponse.status}: ${errorText}`);
      }

      const vpsData = await vpsResponse.json();
      console.log(`[Instance Manager] 📡 CORREÇÃO: VPS sucesso [${creationId}]:`, vpsData);

      // 4. CORREÇÃO: Atualizar status para aguardar webhook
      const { data: updatedInstance } = await supabase
        .from('whatsapp_instances')
        .update({ 
          connection_status: 'waiting_qr',
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id)
        .select()
        .single();

      console.log(`[Instance Manager] ✅ CORREÇÃO: Instância criada com sucesso [${creationId}] - aguardando webhook`);

      return new Response(JSON.stringify({
        success: true,
        instance: updatedInstance || instance,
        vpsInstanceId: vpsInstanceId,
        webhook_enabled: true,
        server_port: 3002,
        creationId,
        message: 'Instância criada com sucesso - aguardando QR Code via webhook'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (vpsError) {
      clearTimeout(vpsTimeoutId);
      console.error(`[Instance Manager] ❌ VPS falhou [${creationId}]:`, vpsError);
      
      // CORREÇÃO: Marcar como erro mas manter no banco
      await supabase
        .from('whatsapp_instances')
        .update({ 
          connection_status: 'vps_error',
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id);
      
      throw new Error(`Falha ao criar instância na VPS: ${vpsError.message}`);
    }

  } catch (error) {
    console.error(`[Instance Manager] ❌ ERRO GERAL [${creationId}]:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      creationId
    }), {
      status: 500,
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

    // 2. Deletar da VPS se tiver vps_instance_id
    if (instance.vps_instance_id) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const deleteResponse = await fetch(`${WEBHOOK_SERVER_CONFIG.baseUrl}/instance/${instance.vps_instance_id}`, {
          method: 'DELETE',
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
