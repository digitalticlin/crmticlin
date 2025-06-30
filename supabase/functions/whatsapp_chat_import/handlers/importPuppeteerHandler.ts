import { createImportSession, processImportProgress, getImportSessionStatus } from '../services/puppeteerService.ts';

interface PuppeteerImportRequest {
  instanceId: string;
  action: 'import_via_puppeteer' | 'webhook_progress' | 'get_status' | 'poll_qr_status' | 'start_import';
  
  // Para validação de usuário
  userValidation?: {
    createdByUserId: string;
    instanceName: string;
  };
  
  // Para webhook de progresso
  sessionId?: string;
  progress?: number;
  status?: 'waiting_qr' | 'connected' | 'importing' | 'completed' | 'error' | 'qr_ready';
  contacts?: any[];
  messages?: any[];
  error?: string;
  totalContacts?: number;
  totalMessages?: number;
  qrCode?: string;
}

export async function handleImportPuppeteer(supabase: any, user: any, body: PuppeteerImportRequest) {
  const { action, instanceId } = body;
  
  console.log(`[Puppeteer Handler] 🎭 Action: ${action} for instance: ${instanceId}`);

  // Para webhooks, verificar instância sem usuário
  if (action === 'webhook_progress') {
    return await handleWebhookProgress(supabase, body);
  }

  // Para 'import_via_puppeteer' NÃO verificar instância - criamos sessão independente na VPS Puppeteer
  // Para outras ações, verificar se instância existe e pertence ao usuário
  if (instanceId && user && action !== 'import_via_puppeteer') {
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (instanceError || !instance) {
      return {
        success: false,
        error: 'Instance not found or access denied',
        status: 404
      };
    }
  }

  switch (action) {
    case 'import_via_puppeteer':
      return await handleCreateSession(supabase, user, body);
    
    case 'webhook_progress':
      return await handleWebhookProgress(supabase, body);
    
    case 'get_status':
      return await handleGetStatus(supabase, body);
    
    case 'poll_qr_status':
      return await handlePollQrStatus(supabase, user, body);
    
    case 'start_import':
      return await handleStartImport(supabase, user, body);
    
    default:
      return {
        success: false,
        error: `Unknown action: ${action}`,
        status: 400
      };
  }
}

// 🆕 Criar sessão de importação + QR Code
async function handleCreateSession(supabase: any, user: any, body: PuppeteerImportRequest) {
  try {
    const { instanceId, userValidation } = body;
    
    console.log(`[Puppeteer Handler] 🚀 Creating import session for: ${instanceId}`);
    console.log(`[Puppeteer Handler] 👤 User ID: ${user.id}`);
    console.log(`[Puppeteer Handler] 📋 UserValidation:`, userValidation);

    // Usar dados da validação do usuário (vindos do modal)
    const instanceName = userValidation?.instanceName || `import_${instanceId}`;
    
    console.log(`[Puppeteer Handler] 📱 Instance data:`, { instanceId, instanceName });

    // Criar sessão na VPS Puppeteer (NOVA sessão independente)
    console.log(`[Puppeteer Handler] 🌐 Chamando createImportSession...`);
    const sessionResult = await createImportSession(instanceId, instanceName);
    
    console.log(`[Puppeteer Handler] 📥 Resultado createImportSession:`, sessionResult);

    if (sessionResult.success) {
      console.log(`[Puppeteer Handler] ✅ VPS retornou sucesso, salvando no banco...`);
      
      // Salvar sessão no banco na nova tabela instances_puppeteer
      const { data: newSession, error: insertError } = await supabase
        .from('instances_puppeteer')
        .insert({
          instance_id: instanceId,
          user_id: user.id,
          session_id: sessionResult.sessionId,
          qr_code: sessionResult.qrCode,
          status: 'waiting_qr'
        })
        .select()
        .single();

      if (insertError) {
        console.error(`[Puppeteer Handler] ❌ Error saving session:`, insertError);
        throw new Error(`Failed to save session: ${insertError.message}`);
      }

      console.log(`[Puppeteer Handler] ✅ Session created: ${sessionResult.sessionId}`);

      return {
        success: true,
        sessionId: sessionResult.sessionId,
        qrCode: sessionResult.qrCode,
        status: 'waiting_qr',
        message: 'QR Code gerado. Escaneie para iniciar importação.'
      };
    } else {
      console.error(`[Puppeteer Handler] ❌ VPS falhou:`, sessionResult.error);
      throw new Error(`VPS Error: ${sessionResult.error || 'Failed to create session on VPS'}`);
    }

  } catch (error: any) {
    console.error(`[Puppeteer Handler] ❌ Error creating session:`, error);
    console.error(`[Puppeteer Handler] ❌ Error stack:`, error.stack);
    return {
      success: false,
      error: error.message,
      status: 500,
      details: {
        errorType: error.constructor.name,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// 🆕 Receber webhook de progresso da VPS
async function handleWebhookProgress(supabase: any, body: PuppeteerImportRequest) {
  try {
    console.log('[Webhook Progress] 📥 Body recebido da VPS:', JSON.stringify(body, null, 2));
    const { sessionId, progress = 0, status, contacts = [], messages = [], error, totalContacts, totalMessages, qrCode } = body;
    
    console.log(`[Webhook Progress] 📊 Atualizando sessão: ${sessionId} - ${progress}% - ${status}`);

    // Atualizar status da sessão na tabela instances_puppeteer
    const updateData: any = {
      status,
      progress,
      total_contacts: totalContacts || 0,
      total_messages: totalMessages || 0,
      error_message: error,
      updated_at: new Date().toISOString()
    };

    // Se há QR Code na requisição, atualizar também
    if (qrCode) {
      updateData.qr_code = qrCode;
      console.log(`[Webhook Progress] 📱 QR Code recebido via webhook - tamanho: ${qrCode.length} chars`);
    }

    // 🔧 CORREÇÃO: UPSERT para criar sessão se não existir
    if (!sessionId) {
      throw new Error('SessionId is required for webhook progress');
    }

    const { data: updatedSession, error: updateError } = await supabase
      .from('instances_puppeteer')
      .upsert({
        session_id: sessionId,
        instance_id: sessionId.split('_')[1], // Extrair instanceId do sessionId
        user_id: null, // Será preenchido depois via RLS ou trigger
        ...updateData
      })
      .select()
      .single();

    if (updateError) {
      console.error(`[Webhook Progress] ❌ Erro ao atualizar sessão:`, updateError);
      throw updateError;
    }

    console.log(`[Webhook Progress] ✅ Sessão atualizada:`, updatedSession);

    // Se há dados para processar, importar
    if (contacts.length > 0 || messages.length > 0) {
      console.log(`[Webhook Progress] 📦 Processando batch: ${contacts.length} contatos, ${messages.length} mensagens`);
      
      // Buscar instância da sessão
      const { data: session } = await supabase
        .from('instances_puppeteer')
        .select(`
          instance_id,
          user_id
        `)
        .eq('session_id', sessionId)
        .single();

      if (session?.instance_id) {
        // Buscar dados da instância WhatsApp
        const { data: whatsappInstance } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('id', session.instance_id)
          .single();

        if (whatsappInstance) {
          const result = await processImportProgress(
            supabase, 
            whatsappInstance, 
            contacts, 
            messages,
            'puppeteer'
          );

          console.log(`[Webhook Progress] 📥 Batch processado: ${result.contactsImported} contatos, ${result.messagesImported} mensagens`);
        }
      }
    }

    // Se importação terminou, marcar como concluída
    if (status === 'completed') {
      console.log(`[Webhook Progress] 🎉 Importação concluída para sessão: ${sessionId}`);
      
      // Opcional: Enviar notificação para o usuário
      const { data: session } = await supabase
        .from('instances_puppeteer')
        .select('user_id, total_contacts, total_messages')
        .eq('session_id', sessionId)
        .single();

      if (session) {
        console.log(`[Webhook Progress] 📬 Enviando notificação para usuário: ${session.user_id}`);
        // Aqui poderia enviar uma notificação via WebSocket/Realtime se necessário
      }
    }

    return {
      success: true,
      message: 'Webhook processed successfully',
      sessionId,
      status,
      progress
    };

  } catch (error: any) {
    console.error(`[Webhook Progress] ❌ Erro ao processar webhook:`, error);
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}

// 🔄 NOVA FUNÇÃO: Polling do status do QR Code
async function handlePollQrStatus(supabase: any, user: any, body: PuppeteerImportRequest) {
  try {
    const { sessionId } = body;
    
    if (!sessionId) {
      return {
        success: false,
        error: 'SessionId is required for polling',
        status: 400
      };
    }

    console.log(`[Poll QR Status] 🔄 Verificando status da sessão: ${sessionId}`);

    // 1. Verificar no banco primeiro
    const { data: dbSession, error: dbError } = await supabase
      .from('instances_puppeteer')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (dbError || !dbSession) {
      console.log(`[Poll QR Status] ❌ Sessão não encontrada no banco: ${sessionId}`);
      return {
        success: false,
        error: 'Session not found',
        status: 404
      };
    }

    // 2. Se já tem QR Code no banco e status é qr_ready, retornar
    if (dbSession.qr_code && dbSession.status === 'qr_ready') {
      console.log(`[Poll QR Status] ✅ QR Code já disponível no banco: ${sessionId}`);
      return {
        success: true,
        qrCode: dbSession.qr_code,
        status: 'qr_ready',
        sessionId,
        message: 'QR Code ready from database'
      };
    }

    // 3. Verificar status na VPS
    const vpsUrl = Deno.env.get('VPS_PUPPETEER_IMPORT') || 'http://31.97.163.57:3001';
    const statusUrl = `${vpsUrl}/session-status/${sessionId}`;

    console.log(`[Poll QR Status] 🌐 Consultando VPS: ${statusUrl}`);

    const vpsResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!vpsResponse.ok) {
      console.error(`[Poll QR Status] ❌ Erro na VPS: ${vpsResponse.status}`);
      return {
        success: false,
        error: `VPS Error: ${vpsResponse.status}`,
        status: vpsResponse.status,
        sessionId
      };
    }

    const vpsData = await vpsResponse.json();
    console.log(`[Poll QR Status] 📥 Resposta da VPS:`, {
      status: vpsData.status,
      hasQrCode: !!vpsData.qrCode,
      qrCodeLength: vpsData.qrCode?.length || 0
    });

    // 4. Se VPS tem QR Code válido, atualizar banco
    if (vpsData.qrCode && vpsData.qrCode.length > 1000) {
      console.log(`[Poll QR Status] 🔄 Atualizando banco com QR Code da VPS`);
      
      const { data: updatedSession, error: updateError } = await supabase
        .from('instances_puppeteer')
        .update({
          qr_code: vpsData.qrCode,
          status: 'qr_ready',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (updateError) {
        console.error(`[Poll QR Status] ❌ Erro ao atualizar banco:`, updateError);
        // Retornar QR Code mesmo com erro no banco
        return {
          success: true,
          qrCode: vpsData.qrCode,
          status: 'qr_ready',
          sessionId,
          message: 'QR Code ready from VPS (database update failed)',
          warning: updateError.message
        };
      }

      console.log(`[Poll QR Status] ✅ QR Code atualizado no banco: ${sessionId}`);
      return {
        success: true,
        qrCode: vpsData.qrCode,
        status: 'qr_ready',
        sessionId,
        message: 'QR Code ready and updated in database'
      };
    }

    // 5. QR Code ainda não está pronto
    console.log(`[Poll QR Status] ⏳ QR Code ainda não está pronto: ${sessionId}`);
    return {
      success: true,
      qrCode: null,
      status: vpsData.status || 'waiting_qr',
      sessionId,
      message: 'QR Code not ready yet, continue polling',
      vpsStatus: vpsData.status
    };

  } catch (error: any) {
    console.error(`[Poll QR Status] ❌ Erro no polling:`, error);
    return {
      success: false,
      error: error.message,
      status: 500,
      sessionId: body.sessionId
    };
  }
}

// 🆕 Obter status da sessão
async function handleGetStatus(supabase: any, body: PuppeteerImportRequest) {
  try {
    const { sessionId } = body;
    
    const { data: session, error } = await supabase
      .from('whatsapp_import_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return {
        success: false,
        error: 'Session not found',
        status: 404
      };
    }

    return {
      success: true,
      session: {
        id: session.id,
        status: session.status,
        progress: session.progress || 0,
        qrCode: session.qr_code,
        totalContacts: session.total_contacts,
        totalMessages: session.total_messages,
        errorMessage: session.error_message,
        createdAt: session.created_at,
        updatedAt: session.updated_at
      },
      status: 200
    };

  } catch (error: any) {
    console.error(`[Puppeteer Handler] ❌ Error getting status:`, error);
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}

// 🆕 Nova função: Iniciar importação
async function handleStartImport(supabase: any, user: any, body: PuppeteerImportRequest) {
  try {
    const { instanceId } = body;
    
    console.log(`[Puppeteer Handler] 🚀 Iniciando importação para: ${instanceId}`);

    // Verificar se instância existe e pertence ao usuário
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (instanceError || !instance) {
      return {
        success: false,
        error: 'Instance not found or access denied',
        status: 404
      };
    }

    // Criar sessão de importação
    const sessionResult = await createImportSession(instanceId, instance.name);
    
    if (sessionResult.success) {
      console.log(`[Puppeteer Handler] ✅ Importação iniciada com sucesso: ${sessionResult.sessionId}`);
      
      // Salvar sessão no banco
      const { data: newSession, error: insertError } = await supabase
        .from('instances_puppeteer')
        .insert({
          instance_id: instanceId,
          user_id: user.id,
          session_id: sessionResult.sessionId,
          qr_code: sessionResult.qrCode,
          status: 'waiting_qr'
        })
        .select()
        .single();

      if (insertError) {
        console.error(`[Puppeteer Handler] ❌ Error saving session:`, insertError);
        throw new Error(`Failed to save session: ${insertError.message}`);
      }

      return {
        success: true,
        sessionId: sessionResult.sessionId,
        qrCode: sessionResult.qrCode,
        status: 'waiting_qr',
        message: 'Importação iniciada com sucesso. QR Code gerado. Escaneie para iniciar importação.'
      };
    } else {
      console.error(`[Puppeteer Handler] ❌ Erro ao iniciar importação:`, sessionResult.error);
      throw new Error(`VPS Error: ${sessionResult.error || 'Failed to start import on VPS'}`);
    }

  } catch (error: any) {
    console.error(`[Puppeteer Handler] ❌ Error starting import:`, error);
    console.error(`[Puppeteer Handler] ❌ Error stack:`, error.stack);
    return {
      success: false,
      error: error.message,
      status: 500,
      details: {
        errorType: error.constructor.name,
        timestamp: new Date().toISOString()
      }
    };
  }
}