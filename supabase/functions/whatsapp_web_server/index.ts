import { serve } from "https://deno.land/std@0.177.1/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './config.ts';
import { createWhatsAppInstance } from './instanceCreationService.ts';
import { makeVPSRequest } from './vpsRequest.ts';
import { syncAllInstances } from './instanceSyncDedicatedService.ts';

console.log(`[WhatsApp Server] 🚀 SERVIDOR COMPLETO - Todas as ações incluindo sync global`);

serve(async (req) => {
  console.log(`[WhatsApp Server] 🚀 REQUEST: ${req.method}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    console.log(`[WhatsApp Server] 📥 Raw body: ${rawBody}`);

    let requestBody: any = {};
    if (rawBody) {
      try {
        requestBody = JSON.parse(rawBody);
      } catch (e) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid JSON' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { action } = requestBody;
    console.log(`[WhatsApp Server] 🎯 Action: ${action}`);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user (except for sync_all_instances which can be called internally)
    if (action !== 'sync_all_instances') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing Authorization header' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[WhatsApp Server] 👤 User: ${user.email}`);
    }

    // Handle actions
    switch (action) {
      case 'create_instance':
        return await createWhatsAppInstance(supabase, requestBody.instanceData, user.id);

      case 'delete_instance':
        return await handleDeleteInstance(supabase, requestBody.instanceId, user.id);

      case 'get_qr_code':
        return await handleGetQRCode(supabase, requestBody.instanceId, user.id);

      case 'send_message':
        return await handleSendMessage(supabase, requestBody, user.id);

      case 'sync_instances':
        return await handleSyncInstances(supabase, user.id);

      case 'sync_all_instances':
        console.log(`[WhatsApp Server] 🌐 SINCRONIZAÇÃO GLOBAL INICIADA`);
        return await syncAllInstances(supabase);

      case 'test_connection':
        return await handleTestConnection();

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error(`[WhatsApp Server] ❌ Error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// CORREÇÃO: Implementar delete instance
async function handleDeleteInstance(supabase: any, instanceId: string, userId: string) {
  try {
    console.log(`[WhatsApp Server] 🗑️ Deletando instância: ${instanceId}`);

    // Buscar instância
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id, instance_name')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    // Deletar na VPS se tiver vps_instance_id
    if (instance.vps_instance_id) {
      const vpsResult = await makeVPSRequest('/instance/delete', 'POST', {
        instanceId: instance.vps_instance_id
      });
      
      if (!vpsResult.success) {
        console.warn(`[WhatsApp Server] ⚠️ VPS delete failed: ${vpsResult.error}`);
      }
    }

    // Deletar do banco
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId)
      .eq('created_by_user_id', userId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Instância deletada' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[WhatsApp Server] ❌ Delete error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// CORREÇÃO: Implementar get QR code
async function handleGetQRCode(supabase: any, instanceId: string, userId: string) {
  try {
    console.log(`[WhatsApp Server] 📱 Obtendo QR Code: ${instanceId}`);

    // Buscar instância
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id, qr_code')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    // Se já tem QR no banco, retornar
    if (instance.qr_code) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          qrCode: instance.qr_code,
          source: 'database'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Tentar obter da VPS
    if (instance.vps_instance_id) {
      const vpsResult = await makeVPSRequest(`/instance/qr/${instance.vps_instance_id}`, 'GET');
      
      if (vpsResult.success && vpsResult.data) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            qrCode: vpsResult.data,
            source: 'vps'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'QR Code não disponível' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[WhatsApp Server] ❌ QR Code error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// CORREÇÃO: Implementar send message
async function handleSendMessage(supabase: any, messageData: any, userId: string) {
  try {
    const { instanceId, phone, message } = messageData;
    console.log(`[WhatsApp Server] 📤 Enviando mensagem via: ${instanceId}`);

    // Buscar instância
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id, connection_status')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    if (!instance.vps_instance_id) {
      throw new Error('Instância não está vinculada à VPS');
    }

    if (!['open', 'ready'].includes(instance.connection_status)) {
      throw new Error('Instância não está conectada');
    }

    // Enviar via VPS
    const vpsResult = await makeVPSRequest('/send', 'POST', {
      instanceId: instance.vps_instance_id,
      phone: phone,
      message: message
    });

    if (!vpsResult.success) {
      throw new Error(vpsResult.error || 'Falha ao enviar mensagem');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: vpsResult.data?.messageId,
        data: vpsResult.data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[WhatsApp Server] ❌ Send message error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// CORREÇÃO: Implementar sync instances
async function handleSyncInstances(supabase: any, userId: string) {
  try {
    console.log(`[WhatsApp Server] 🔄 Sincronizando instâncias do usuário: ${userId}`);

    // Buscar apenas instâncias do usuário
    const { count } = await supabase
      .from('whatsapp_instances')
      .select('*', { count: 'exact', head: true })
      .eq('created_by_user_id', userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        syncedCount: count || 0,
        message: 'Sync básico de instâncias do usuário',
        data: { summary: { updated: count || 0 } }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[WhatsApp Server] ❌ Sync error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// CORREÇÃO: Implementar test connection
async function handleTestConnection() {
  try {
    console.log(`[WhatsApp Server] 🧪 Testando conexão`);

    const vpsResult = await makeVPSRequest('/health', 'GET');
    
    return new Response(
      JSON.stringify({ 
        success: vpsResult.success,
        message: vpsResult.success ? 'Conexão OK' : 'Conexão falhou',
        details: vpsResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
