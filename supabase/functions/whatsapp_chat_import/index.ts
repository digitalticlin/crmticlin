
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 45000
};

interface ImportRequest {
  instanceId: string;
  importType: 'contacts' | 'messages' | 'both';
  batchSize?: number;
  lastSyncTimestamp?: string;
}

function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

async function authenticateUser(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { success: false, error: 'No authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { success: false, error: 'Invalid token' };
  }

  return { success: true, user };
}

async function makeVPSRequest(endpoint: string, method: string = 'GET', payload?: any) {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  console.log(`[Chat Import] ${method} ${url}`);
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`
    },
    signal: AbortSignal.timeout(VPS_CONFIG.timeout)
  };

  if (payload && method !== 'GET') {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(url, options);
  const responseText = await response.text();
  
  console.log(`[Chat Import] Response (${response.status}):`, responseText.substring(0, 200));

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = { raw: responseText };
  }

  return { response, data };
}

async function importContacts(supabase: any, instance: any, batchSize: number = 50) {
  console.log(`[Chat Import] 👥 Importando contatos da instância: ${instance.instance_name}`);

  try {
    const { response, data } = await makeVPSRequest(`/instance/${instance.vps_instance_id}/contacts`, 'GET');

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao obter contatos da VPS');
    }

    const contacts = data.contacts || data || [];
    console.log(`[Chat Import] 📊 ${contacts.length} contatos encontrados`);

    if (contacts.length === 0) {
      return { success: true, imported: 0, message: 'Nenhum contato encontrado' };
    }

    let importedCount = 0;
    const contactBatches = [];
    
    // Dividir em lotes
    for (let i = 0; i < contacts.length; i += batchSize) {
      contactBatches.push(contacts.slice(i, i + batchSize));
    }

    for (const batch of contactBatches) {
      const contactsToInsert = [];
      
      for (const contact of batch) {
        try {
          const cleanPhone = cleanPhoneNumber(contact.id || contact.phone || '');
          if (!cleanPhone) continue;

          // Verificar se já existe
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', cleanPhone)
            .eq('whatsapp_number_id', instance.id)
            .single();

          if (!existingLead) {
            contactsToInsert.push({
              phone: cleanPhone,
              name: contact.name || contact.pushname || `Contato-${cleanPhone.substring(cleanPhone.length - 4)}`,
              whatsapp_number_id: instance.id,
              company_id: instance.company_id,
              last_message: 'Contato importado',
              last_message_time: new Date().toISOString(),
              created_at: new Date().toISOString()
            });
          }
        } catch (error: any) {
          console.warn(`[Chat Import] ⚠️ Erro ao processar contato:`, error.message);
        }
      }

      if (contactsToInsert.length > 0) {
        const { error } = await supabase
          .from('leads')
          .insert(contactsToInsert);

        if (error) {
          console.error(`[Chat Import] ❌ Erro ao inserir lote de contatos:`, error);
        } else {
          importedCount += contactsToInsert.length;
          console.log(`[Chat Import] ✅ Lote inserido: ${contactsToInsert.length} contatos`);
        }
      }

      // Pequena pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`[Chat Import] ✅ Importação de contatos concluída: ${importedCount} novos contatos`);
    
    return {
      success: true,
      imported: importedCount,
      total: contacts.length,
      message: `${importedCount} novos contatos importados de ${contacts.length} encontrados`
    };

  } catch (error: any) {
    console.error(`[Chat Import] ❌ Erro na importação de contatos:`, error.message);
    return {
      success: false,
      error: error.message,
      imported: 0
    };
  }
}

async function importMessages(supabase: any, instance: any, batchSize: number = 30, lastSyncTimestamp?: string) {
  console.log(`[Chat Import] 💬 Importando mensagens da instância: ${instance.instance_name}`);

  try {
    const endpoint = lastSyncTimestamp 
      ? `/instance/${instance.vps_instance_id}/messages?since=${lastSyncTimestamp}`
      : `/instance/${instance.vps_instance_id}/messages`;
      
    const { response, data } = await makeVPSRequest(endpoint, 'GET');

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao obter mensagens da VPS');
    }

    const messages = data.messages || data || [];
    console.log(`[Chat Import] 📊 ${messages.length} mensagens encontradas`);

    if (messages.length === 0) {
      return { success: true, imported: 0, message: 'Nenhuma mensagem nova encontrada' };
    }

    let importedCount = 0;
    const messageBatches = [];
    
    // Dividir em lotes menores para mensagens (processamento mais pesado)
    for (let i = 0; i < messages.length; i += batchSize) {
      messageBatches.push(messages.slice(i, i + batchSize));
    }

    for (const batch of messageBatches) {
      const messagesToInsert = [];
      
      for (const message of batch) {
        try {
          const phoneNumber = message.from || message.phone || message.remoteJid || '';
          if (!phoneNumber) continue;

          const cleanPhone = cleanPhoneNumber(phoneNumber.replace('@c.us', ''));
          if (!cleanPhone) continue;

          // Buscar ou criar lead
          let leadId: string;
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', cleanPhone)
            .eq('whatsapp_number_id', instance.id)
            .single();

          if (existingLead) {
            leadId = existingLead.id;
          } else {
            // Criar novo lead
            const { data: newLead, error: leadError } = await supabase
              .from('leads')
              .insert({
                phone: cleanPhone,
                name: `Lead-${cleanPhone.substring(cleanPhone.length - 4)}`,
                whatsapp_number_id: instance.id,
                company_id: instance.company_id,
                last_message: 'Conversa importada',
                last_message_time: new Date().toISOString()
              })
              .select('id')
              .single();

            if (leadError || !newLead) {
              console.warn(`[Chat Import] ⚠️ Erro ao criar lead para ${cleanPhone}`);
              continue;
            }
            leadId = newLead.id;
          }

          // Verificar se mensagem já existe
          const messageId = message.id || message.messageId || `import_${Date.now()}_${Math.random()}`;
          const { data: existingMessage } = await supabase
            .from('messages')
            .select('id')
            .eq('external_id', messageId)
            .single();

          if (!existingMessage) {
            messagesToInsert.push({
              whatsapp_number_id: instance.id,
              lead_id: leadId,
              text: message.body || message.text || message.message || '',
              from_me: message.fromMe || false,
              status: message.fromMe ? 'sent' : 'received',
              external_id: messageId,
              media_type: message.type || 'text',
              media_url: message.mediaUrl,
              timestamp: message.timestamp || new Date().toISOString()
            });
          }
        } catch (error: any) {
          console.warn(`[Chat Import] ⚠️ Erro ao processar mensagem:`, error.message);
        }
      }

      if (messagesToInsert.length > 0) {
        const { error } = await supabase
          .from('messages')
          .insert(messagesToInsert);

        if (error) {
          console.error(`[Chat Import] ❌ Erro ao inserir lote de mensagens:`, error);
        } else {
          importedCount += messagesToInsert.length;
          console.log(`[Chat Import] ✅ Lote inserido: ${messagesToInsert.length} mensagens`);
        }
      }

      // Pausa maior entre lotes de mensagens
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[Chat Import] ✅ Importação de mensagens concluída: ${importedCount} novas mensagens`);
    
    return {
      success: true,
      imported: importedCount,
      total: messages.length,
      message: `${importedCount} novas mensagens importadas de ${messages.length} encontradas`
    };

  } catch (error: any) {
    console.error(`[Chat Import] ❌ Erro na importação de mensagens:`, error.message);
    return {
      success: false,
      error: error.message,
      imported: 0
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action } = body;

    console.log(`[Chat Import] 🎯 Ação: ${action}`);

    // Autenticar usuário
    const authResult = await authenticateUser(req, supabase);
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user } = authResult;

    switch (action) {
      case 'import_data': {
        const { instanceId, importType = 'both', batchSize = 30, lastSyncTimestamp }: ImportRequest = body;
        
        if (!instanceId) {
          return new Response(
            JSON.stringify({ success: false, error: 'instanceId é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Buscar instância
        const { data: instance, error: instanceError } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('id', instanceId)
          .eq('created_by_user_id', user.id)
          .single();

        if (instanceError || !instance) {
          return new Response(
            JSON.stringify({ success: false, error: 'Instância não encontrada' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!['ready', 'open'].includes(instance.connection_status)) {
          return new Response(
            JSON.stringify({ success: false, error: `Instância não está conectada. Status: ${instance.connection_status}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[Chat Import] 🚀 Iniciando importação ${importType} para: ${instance.instance_name}`);

        const results = {
          contacts: { success: true, imported: 0, message: 'Não solicitado' },
          messages: { success: true, imported: 0, message: 'Não solicitado' }
        };

        // Importar contatos se solicitado
        if (importType === 'contacts' || importType === 'both') {
          results.contacts = await importContacts(supabase, instance, batchSize);
        }

        // Importar mensagens se solicitado
        if (importType === 'messages' || importType === 'both') {
          results.messages = await importMessages(supabase, instance, batchSize, lastSyncTimestamp);
        }

        // Atualizar timestamp da última sincronização
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', instanceId);

        if (updateError) {
          console.warn(`[Chat Import] ⚠️ Erro ao atualizar timestamp:`, updateError);
        }

        const totalImported = results.contacts.imported + results.messages.imported;
        const overallSuccess = results.contacts.success && results.messages.success;

        console.log(`[Chat Import] 🎉 Importação concluída: ${totalImported} itens importados`);

        return new Response(
          JSON.stringify({
            success: overallSuccess,
            message: `Importação concluída: ${totalImported} itens importados`,
            results: results,
            summary: {
              totalImported,
              contactsImported: results.contacts.imported,
              messagesImported: results.messages.imported,
              importType,
              timestamp: new Date().toISOString()
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_import_status': {
        const { instanceId } = body;
        
        if (!instanceId) {
          return new Response(
            JSON.stringify({ success: false, error: 'instanceId é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Buscar dados de importação
        const { data: instance } = await supabase
          .from('whatsapp_instances')
          .select('last_sync_at, created_at')
          .eq('id', instanceId)
          .eq('created_by_user_id', user.id)
          .single();

        const { count: contactsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('whatsapp_number_id', instanceId);

        const { count: messagesCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('whatsapp_number_id', instanceId);

        return new Response(
          JSON.stringify({
            success: true,
            status: {
              lastSyncAt: instance?.last_sync_at,
              contactsImported: contactsCount || 0,
              messagesImported: messagesCount || 0,
              instanceCreatedAt: instance?.created_at
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'import_chats_gradual': {
        // Ação especial para ser chamada pelo webhook automaticamente
        const { instanceId, vpsInstanceId } = body;
        
        if (!instanceId && !vpsInstanceId) {
          return new Response(
            JSON.stringify({ success: false, error: 'instanceId ou vpsInstanceId é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Buscar instância por ID do banco ou VPS
        const query = supabase.from('whatsapp_instances').select('*');
        if (instanceId) {
          query.eq('id', instanceId);
        } else {
          query.eq('vps_instance_id', vpsInstanceId);
        }
        
        const { data: instance, error: instanceError } = await query.single();

        if (instanceError || !instance) {
          console.error(`[Chat Import] ❌ Instância não encontrada:`, instanceError);
          return new Response(
            JSON.stringify({ success: false, error: 'Instância não encontrada' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[Chat Import] 🚀 Importação automática iniciada para: ${instance.instance_name}`);

        // Importação gradual - apenas contatos primeiro
        const contactResults = await importContacts(supabase, instance, 25);
        
        // Aguardar um pouco antes de importar mensagens
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Importar mensagens mais recentes (último mês)
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const messageResults = await importMessages(supabase, instance, 20, oneMonthAgo);

        // Atualizar timestamp
        await supabase
          .from('whatsapp_instances')
          .update({
            last_sync_at: new Date().toISOString(),
            history_imported: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', instance.id);

        console.log(`[Chat Import] ✅ Importação automática concluída: ${contactResults.imported + messageResults.imported} itens`);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Importação automática concluída',
            contactsImported: contactResults.imported,
            messagesImported: messageResults.imported,
            totalImported: contactResults.imported + messageResults.imported
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Ação não reconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('[Chat Import] ❌ Erro:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
