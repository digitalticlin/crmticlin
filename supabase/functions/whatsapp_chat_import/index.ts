import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// CORREÇÃO: URL VPS com porta 3002 e token correto
const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
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

async function importHistoryFromVPS(supabase: any, instance: any, importType: string = 'both', batchSize: number = 50, lastSyncTimestamp?: string) {
  console.log(`[Chat Import] 📚 Importando histórico da instância: ${instance.instance_name}`);

  try {
    // CORREÇÃO: Usar endpoint correto da VPS
    const url = `${VPS_CONFIG.baseUrl}/instance/${instance.vps_instance_id}/import-history`;
    console.log(`[Chat Import] 🎯 POST ${url}`);
    
    const requestBody = {
      importType,
      batchSize,
      ...(lastSyncTimestamp && { lastSyncTimestamp })
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'X-API-Token': VPS_CONFIG.authToken
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    const responseText = await response.text();
    console.log(`[Chat Import] 📋 Response (${response.status}):`, responseText.substring(0, 200));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Falha ao importar histórico da VPS');
    }

    // Processar contatos se existirem
    let contactsImported = 0;
    if (data.contacts && Array.isArray(data.contacts)) {
      console.log(`[Chat Import] 👥 Processando ${data.contacts.length} contatos`);
      
      for (const contact of data.contacts) {
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
            const { error } = await supabase
              .from('leads')
              .insert({
                phone: cleanPhone,
                name: contact.name || contact.pushname || `Contato-${cleanPhone.substring(cleanPhone.length - 4)}`,
                whatsapp_number_id: instance.id,
                company_id: instance.company_id,
                last_message: 'Contato importado',
                last_message_time: new Date().toISOString(),
                created_at: new Date().toISOString()
              });

            if (!error) {
              contactsImported++;
            }
          }
        } catch (error: any) {
          console.warn(`[Chat Import] ⚠️ Erro ao processar contato:`, error.message);
        }
      }
    }

    // Processar mensagens se existirem
    let messagesImported = 0;
    if (data.messages && Array.isArray(data.messages)) {
      console.log(`[Chat Import] 💬 Processando ${data.messages.length} mensagens`);
      
      for (const message of data.messages) {
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
            const { error } = await supabase
              .from('messages')
              .insert({
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

            if (!error) {
              messagesImported++;
            }
          }
        } catch (error: any) {
          console.warn(`[Chat Import] ⚠️ Erro ao processar mensagem:`, error.message);
        }
      }
    }

    console.log(`[Chat Import] ✅ Importação concluída: ${contactsImported} contatos, ${messagesImported} mensagens`);
    
    return {
      success: true,
      contactsImported,
      messagesImported,
      totalImported: contactsImported + messagesImported,
      message: `${contactsImported} contatos e ${messagesImported} mensagens importados`
    };

  } catch (error: any) {
    console.error(`[Chat Import] ❌ Erro na importação:`, error.message);
    return {
      success: false,
      error: error.message,
      contactsImported: 0,
      messagesImported: 0
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

        if (!['ready', 'open', 'connected'].includes(instance.connection_status)) {
          return new Response(
            JSON.stringify({ success: false, error: `Instância não está conectada. Status: ${instance.connection_status}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[Chat Import] 🚀 Iniciando importação ${importType} para: ${instance.instance_name}`);

        // CORREÇÃO: Usar função única que chama endpoint correto da VPS
        const result = await importHistoryFromVPS(supabase, instance, importType, batchSize, lastSyncTimestamp);

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

        console.log(`[Chat Import] 🎉 Importação concluída: ${result.totalImported} itens importados`);

        return new Response(
          JSON.stringify({
            success: result.success,
            message: result.message,
            results: {
              contacts: { success: true, imported: result.contactsImported, message: `${result.contactsImported} contatos importados` },
              messages: { success: true, imported: result.messagesImported, message: `${result.messagesImported} mensagens importadas` }
            },
            summary: {
              totalImported: result.totalImported,
              contactsImported: result.contactsImported,
              messagesImported: result.messagesImported,
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
