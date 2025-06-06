import { VPS_CONFIG } from './config.ts';

export async function importChatHistory(supabase: any, instanceData: any) {
  console.log('[Chat History Import] 📚 Iniciando importação do histórico:', instanceData);
  
  try {
    const { instanceId, vpsInstanceId, companyId } = instanceData;
    
    if (!vpsInstanceId) {
      throw new Error('VPS Instance ID não fornecido');
    }

    console.log('[Chat History Import] 🔍 Solicitando histórico da VPS para:', vpsInstanceId);
    
    // Fazer requisição para VPS para obter histórico de chats
    const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/api/history/${vpsInstanceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      }
    });

    if (!vpsResponse.ok) {
      throw new Error(`Erro na VPS: ${vpsResponse.status} - ${vpsResponse.statusText}`);
    }

    const historyData = await vpsResponse.json();
    console.log('[Chat History Import] 📊 Histórico recebido:', {
      chats: historyData.chats?.length || 0,
      messages: historyData.totalMessages || 0
    });

    // Processar cada chat do histórico
    let processedChats = 0;
    let processedMessages = 0;

    if (historyData.chats && historyData.chats.length > 0) {
      for (const chat of historyData.chats) {
        try {
          // Processar lead (contato)
          const leadResult = await processHistoryLead(supabase, chat, instanceId, companyId);
          
          if (leadResult.success && chat.messages && chat.messages.length > 0) {
            // Processar mensagens do chat
            const messagesResult = await processHistoryMessages(
              supabase, 
              chat.messages, 
              leadResult.leadId, 
              instanceId
            );
            processedMessages += messagesResult.processed;
          }
          
          processedChats++;
        } catch (chatError) {
          console.error('[Chat History Import] ⚠️ Erro ao processar chat:', chatError);
        }
      }
    }

    console.log('[Chat History Import] ✅ Importação concluída:', {
      processedChats,
      processedMessages
    });

    return {
      success: true,
      data: {
        processedChats,
        processedMessages,
        totalChats: historyData.chats?.length || 0,
        totalMessages: historyData.totalMessages || 0
      }
    };

  } catch (error) {
    console.error('[Chat History Import] ❌ Erro na importação:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Processar lead do histórico
async function processHistoryLead(supabase: any, chat: any, instanceId: string, companyId: string) {
  try {
    const phone = chat.id.replace(/\D/g, ''); // Limpar telefone
    
    if (!phone) {
      throw new Error('Telefone inválido no chat');
    }

    // Verificar se lead já existe
    const { data: existingLead, error: searchError } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', phone)
      .eq('whatsapp_number_id', instanceId)
      .maybeSingle();

    if (searchError) {
      throw new Error(`Erro ao buscar lead: ${searchError.message}`);
    }

    if (existingLead) {
      console.log('[History Lead] ♻️ Lead já existe:', phone);
      return { success: true, leadId: existingLead.id };
    }

    // Criar novo lead
    const { data: newLead, error: createError } = await supabase
      .from('leads')
      .insert({
        phone,
        name: chat.name || `Contato ${phone}`,
        whatsapp_number_id: instanceId,
        company_id: companyId,
        created_by_user_id: null // Importação automática
      })
      .select('id')
      .single();

    if (createError) {
      throw new Error(`Erro ao criar lead: ${createError.message}`);
    }

    console.log('[History Lead] ✅ Lead criado:', phone);
    return { success: true, leadId: newLead.id };

  } catch (error) {
    console.error('[History Lead] ❌ Erro:', error);
    return { success: false, error: error.message };
  }
}

// Processar mensagens do histórico
async function processHistoryMessages(supabase: any, messages: any[], leadId: string, instanceId: string) {
  let processed = 0;
  
  try {
    // Processar mensagens em lotes para melhor performance
    const batchSize = 50;
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      const messagesToInsert = batch.map(msg => ({
        lead_id: leadId,
        whatsapp_number_id: instanceId,
        text: msg.body || '',
        from_me: msg.fromMe || false,
        timestamp: msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() : new Date().toISOString(),
        external_id: msg.id || null,
        media_type: msg.type === 'image' ? 'image' : msg.type === 'document' ? 'document' : null,
        media_url: msg.mediaUrl || null
      }));

      const { error: insertError } = await supabase
        .from('messages')
        .insert(messagesToInsert);

      if (insertError) {
        console.error('[History Messages] ⚠️ Erro ao inserir lote:', insertError);
      } else {
        processed += batch.length;
      }
    }

    console.log('[History Messages] ✅ Mensagens processadas:', processed);
    return { success: true, processed };

  } catch (error) {
    console.error('[History Messages] ❌ Erro:', error);
    return { success: false, processed, error: error.message };
  }
}
