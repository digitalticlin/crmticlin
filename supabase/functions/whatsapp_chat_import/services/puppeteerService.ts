// supabase/functions/whatsapp_chat_import/services/puppeteerService.ts

// import { processContacts } from './contactService.ts';
// import { processMessagesWithDeduplication } from './messageServiceAdvanced.ts';

// Configurações da VPS Puppeteer
const VPS_PUPPETEER_CONFIG = {
  baseUrl: Deno.env.get('PUPPETEER_VPS_URL') || 'http://31.97.163.57:3001',
  token: Deno.env.get('VPS_PUPPETEER_IMPORT') || '8bb0c4f8a89d254783d693050ecd7ff4878534f46a87ece12b24f506548ce430',
  webhookUrl: 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_chat_import'
};

// 🎭 Criar sessão de importação na VPS Puppeteer
export async function createImportSession(instanceId: string, instanceName: string) {
  try {
    console.log(`[Puppeteer Service] 🚀 Iniciando criação de sessão para: ${instanceId}`);
    console.log(`[Puppeteer Service] 📋 Config VPS: ${VPS_PUPPETEER_CONFIG.baseUrl}`);
    console.log(`[Puppeteer Service] 🔑 Token length: ${VPS_PUPPETEER_CONFIG.token.length}`);
    console.log(`[Puppeteer Service] 🌐 Webhook URL: ${VPS_PUPPETEER_CONFIG.webhookUrl}`);

    // TESTE DE CONECTIVIDADE PRIMEIRO
    console.log(`[Puppeteer Service] 🔍 Testando conectividade básica com VPS...`);
    try {
      const healthCheck = await fetch(`${VPS_PUPPETEER_CONFIG.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VPS_PUPPETEER_CONFIG.token}`
        }
      });
      console.log(`[Puppeteer Service] 🏥 Health check - Status: ${healthCheck.status}`);
    } catch (healthError) {
      console.error(`[Puppeteer Service] ❌ Health check falhou:`, healthError);
    }

    const requestBody = {
      instanceId,
      instanceName,
      webhookUrl: VPS_PUPPETEER_CONFIG.webhookUrl
    };

    console.log(`[Puppeteer Service] 📤 Enviando requisição para VPS:`, requestBody);

    const response = await fetch(`${VPS_PUPPETEER_CONFIG.baseUrl}/start-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_PUPPETEER_CONFIG.token}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`[Puppeteer Service] 📥 Resposta VPS - Status: ${response.status}`);
    console.log(`[Puppeteer Service] 📥 Resposta VPS - StatusText: ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Puppeteer Service] ❌ Erro HTTP ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Puppeteer Service] ✅ Dados recebidos da VPS:`, data);

    return {
      success: true,
      sessionId: data.sessionId,
      qrCode: data.qrCode,
      status: data.status || 'waiting_qr'
    };
  } catch (error: any) {
    console.error(`[Puppeteer Service] ❌ Error creating session:`, error);
    console.error(`[Puppeteer Service] ❌ Error details:`, {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return {
      success: false,
      error: error.message
    };
  }
}

// 📊 Processar progresso da importação (chamado pelo webhook)
export async function processImportProgress() {
  return { ok: true }
}

// 🔄 Obter status da sessão na VPS
export async function getImportSessionStatus() {
  return { ok: true }
}

// 🗑️ Deletar sessão na VPS (cleanup)
export async function deleteImportSession(sessionId: string) {
  const puppeteerVpsUrl = Deno.env.get('PUPPETEER_VPS_URL') || 'http://31.97.163.57:3001';
  const puppeteerToken = Deno.env.get('VPS_PUPPETEER_IMPORT') || 'default-token';

  try {
    const response = await fetch(`${puppeteerVpsUrl}/delete-session/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${puppeteerToken}`
      }
    });

    return response.ok;
  } catch (error: any) {
    console.error(`[Puppeteer Service] ❌ Error deleting session:`, error);
    return false;
  }
}

// 🔔 Enviar notificação de conclusão (webhook interno)
export async function sendCompletionNotification(supabase: any, sessionData: any) {
  try {
    // Buscar dados completos da sessão
    const { data: session } = await supabase
      .from('whatsapp_import_sessions')
      .select(`
        *,
        whatsapp_instances (
          instance_name,
          vps_instance_id,
          created_by_user_id
        )
      `)
      .eq('id', sessionData.sessionId)
      .single();

    if (!session || !session.whatsapp_instances) {
      console.error('[Puppeteer Service] ❌ Session or instance not found');
      return false;
    }

    const instanceName = session.whatsapp_instances.instance_name;
    const userId = session.whatsapp_instances.created_by_user_id;
    const phoneNumber = session.whatsapp_instances.vps_instance_id || 'N/A';

    // Criar notificação no banco para o usuário
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'import_completed',
        title: `Importação Concluída - ${instanceName}`,
        message: `A importação do histórico do número ${phoneNumber} foi concluída com sucesso! ${session.total_contacts || 0} contatos e ${session.total_messages || 0} mensagens foram importados.`,
        data: {
          sessionId: session.id,
          instanceId: session.instance_id,
          instanceName,
          phoneNumber,
          totalContacts: session.total_contacts || 0,
          totalMessages: session.total_messages || 0,
          importSource: 'puppeteer'
        },
        read: false,
        created_at: new Date().toISOString()
      });

    console.log(`[Puppeteer Service] 🔔 Notification sent to user: ${userId}`);
    
    // Opcional: Enviar notificação em tempo real via WebSocket/Realtime
    // supabase.channel('notifications').send({ ... })
    
    return true;

  } catch (error: any) {
    console.error(`[Puppeteer Service] ❌ Error sending notification:`, error);
    return false;
  }
}