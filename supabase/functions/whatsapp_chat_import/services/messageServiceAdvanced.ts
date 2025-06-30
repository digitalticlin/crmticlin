import { cleanPhoneNumber } from './phoneService.ts';

// 🧠 Processar mensagens com detecção avançada de duplicados
export async function processMessagesWithDeduplication(
  supabase: any, 
  messages: any[], 
  instance: any, 
  source: string = 'puppeteer'
) {
  let messagesImported = 0;
  let duplicatesSkipped = 0;
  
  if (!messages || !Array.isArray(messages)) {
    console.log(`[Message Service Advanced] ℹ️ No messages to process`);
    return messagesImported;
  }

  console.log(`[Message Service Advanced] 💬 Processing ${messages.length} messages from ${source}`);
  
  // Processar mensagens em lotes para melhor performance
  const batchSize = 20;
  
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    console.log(`[Message Service Advanced] 📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(messages.length / batchSize)}`);
    
    for (const message of batch) {
      try {
        // Extrair telefone da mensagem
        const rawPhone = message.from || message.remoteJid || message.chatId || '';
        const cleanPhone = cleanPhoneNumber(rawPhone);
        
        if (!cleanPhone) {
          console.warn(`[Message Service Advanced] ⚠️ Message without valid phone:`, message);
          continue;
        }

        // Buscar ou criar lead
        let leadId = await findOrCreateLead(supabase, cleanPhone, instance, source);
        
        if (!leadId) {
          console.warn(`[Message Service Advanced] ⚠️ Could not find/create lead for:`, cleanPhone);
          continue;
        }

        // Preparar dados da mensagem
        const messageData = await prepareMessageData(message, leadId, instance, source);
        
        // 🔍 Verificar duplicados com múltiplas estratégias
        const isDuplicate = await checkForDuplicates(supabase, messageData, leadId, instance.id);
        
        if (isDuplicate) {
          duplicatesSkipped++;
          console.log(`[Message Service Advanced] 🔄 Duplicate skipped: ${cleanPhone} - ${messageData.text?.substring(0, 30)}...`);
          continue;
        }

        // Inserir mensagem
        const { error } = await supabase
          .from('messages')
          .insert(messageData);

        if (!error) {
          messagesImported++;
          console.log(`[Message Service Advanced] ✅ Message saved: ${cleanPhone} - ${source}`);
        } else {
          console.error(`[Message Service Advanced] ❌ Error saving message:`, error);
        }

      } catch (error: any) {
        console.warn(`[Message Service Advanced] ⚠️ Error processing message:`, error.message);
      }
    }

    // Pequena pausa entre lotes
    if (i + batchSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }

  console.log(`[Message Service Advanced] ✅ Processing completed:`, {
    messagesImported,
    duplicatesSkipped,
    totalProcessed: messages.length,
    source
  });

  return messagesImported;
}

// 🔍 Verificar duplicados com múltiplas estratégias
async function checkForDuplicates(supabase: any, messageData: any, leadId: string, instanceId: string) {
  try {
    // Estratégia 1: Por external_message_id (mais confiável)
    if (messageData.external_message_id) {
      const { data: byExternalId } = await supabase
        .from('messages')
        .select('id')
        .eq('external_message_id', messageData.external_message_id)
        .eq('whatsapp_number_id', instanceId)
        .maybeSingle();

      if (byExternalId) {
        console.log(`[Duplicate Check] 🎯 Found by external_id: ${messageData.external_message_id}`);
        return true;
      }
    }

    // Estratégia 2: Por hash do conteúdo (conteúdo + timestamp + from_me)
    if (messageData.content_hash) {
      const { data: byContentHash } = await supabase
        .from('messages')
        .select('id')
        .eq('content_hash', messageData.content_hash)
        .eq('lead_id', leadId)
        .eq('whatsapp_number_id', instanceId)
        .maybeSingle();

      if (byContentHash) {
        console.log(`[Duplicate Check] 🔐 Found by content hash: ${messageData.content_hash.substring(0, 8)}...`);
        return true;
      }
    }

    // Estratégia 3: Por conteúdo + timestamp aproximado (±30 segundos)
    if (messageData.text && messageData.timestamp) {
      const timestamp = new Date(messageData.timestamp);
      const before = new Date(timestamp.getTime() - 30000).toISOString(); // -30s
      const after = new Date(timestamp.getTime() + 30000).toISOString();  // +30s

      const { data: byContentTime } = await supabase
        .from('messages')
        .select('id')
        .eq('lead_id', leadId)
        .eq('text', messageData.text)
        .eq('from_me', messageData.from_me)
        .gte('timestamp', before)
        .lte('timestamp', after)
        .maybeSingle();

      if (byContentTime) {
        console.log(`[Duplicate Check] ⏱️ Found by content+time: ${messageData.text.substring(0, 20)}...`);
        return true;
      }
    }

    return false; // Não é duplicado

  } catch (error: any) {
    console.error(`[Duplicate Check] ❌ Error checking duplicates:`, error);
    return false; // Em caso de erro, permitir inserção
  }
}

// 📝 Preparar dados da mensagem com hashes e IDs
async function prepareMessageData(message: any, leadId: string, instance: any, source: string) {
  const text = message.body || message.text || '';
  const timestamp = message.timestamp ? 
    new Date(typeof message.timestamp === 'number' ? message.timestamp * 1000 : message.timestamp) : 
    new Date();

  // Gerar hash do conteúdo para detecção de duplicados
  const contentHash = await generateContentHash(text, timestamp.toISOString(), message.fromMe || false);

  return {
    lead_id: leadId,
    whatsapp_number_id: instance.id,
    text,
    from_me: Boolean(message.fromMe),
    timestamp: timestamp.toISOString(),
    created_by_user_id: instance.created_by_user_id,
    media_type: getMediaType(message),
    media_url: message.mediaUrl || message.url || null,
    external_message_id: message.id || message.messageId || null,
    import_source: source,
    content_hash: contentHash,
    created_at: new Date().toISOString()
  };
}

// 🔐 Gerar hash do conteúdo
async function generateContentHash(text: string, timestamp: string, fromMe: boolean): Promise<string> {
  try {
    const content = `${text}|${timestamp}|${fromMe}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  } catch (error) {
    // Fallback simples se crypto não estiver disponível
    return `${text.length}_${timestamp.substring(0, 10)}_${fromMe}`.replace(/[^a-zA-Z0-9]/g, '_');
  }
}

// 👤 Buscar ou criar lead
async function findOrCreateLead(supabase: any, phone: string, instance: any, source: string) {
  try {
    // Buscar lead existente
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', phone)
      .eq('whatsapp_number_id', instance.id)
      .maybeSingle();

    if (existingLead) {
      return existingLead.id;
    }

    // Criar novo lead
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({
        phone,
        name: `Contato +${phone}`,
        whatsapp_number_id: instance.id,
        company_id: instance.company_id || null,
        created_by_user_id: instance.created_by_user_id,
        last_message: 'Imported contact',
        last_message_time: new Date().toISOString(),
        import_source: source
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[Message Service Advanced] ❌ Error creating lead:`, error);
      return null;
    }

    console.log(`[Message Service Advanced] ✅ Lead created: ${phone} (${source})`);
    return newLead.id;
  } catch (error: any) {
    console.error(`[Message Service Advanced] ❌ Error in findOrCreateLead:`, error.message);
    return null;
  }
}

// 📎 Obter tipo de mídia
function getMediaType(message: any): string {
  if (message.type === 'image' || message.messageType === 'imageMessage') return 'image';
  if (message.type === 'video' || message.messageType === 'videoMessage') return 'video';
  if (message.type === 'audio' || message.messageType === 'audioMessage') return 'audio';
  if (message.type === 'document' || message.messageType === 'documentMessage') return 'document';
  return 'text';
} 