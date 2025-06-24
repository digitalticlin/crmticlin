
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
  console.log(`[Chat Import] 🔍 VPS Instance ID: "${instance.vps_instance_id}"`);
  console.log(`[Chat Import] 🔍 Import Type: ${importType}, Batch Size: ${batchSize}`);

  // VALIDAÇÃO CRÍTICA: Verificar se vps_instance_id existe e não está vazio
  if (!instance.vps_instance_id || instance.vps_instance_id.trim() === '') {
    console.error(`[Chat Import] ❌ ERRO: vps_instance_id está vazio ou nulo para instância ${instance.instance_name}`);
    return {
      success: false,
      error: 'VPS Instance ID não encontrado para esta instância',
      contactsImported: 0,
      messagesImported: 0
    };
  }

  try {
    // CORREÇÃO: Usar endpoint correto da VPS com vps_instance_id validado
    const url = `${VPS_CONFIG.baseUrl}/instance/${instance.vps_instance_id}/import-history`;
    console.log(`[Chat Import] 🎯 POST ${url}`);
    console.log(`[Chat Import] 🔐 Usando token: ${VPS_CONFIG.authToken.substring(0, 10)}...`);
    
    const requestBody = {
      importType,
      batchSize,
      ...(lastSyncTimestamp && { lastSyncTimestamp })
    };

    console.log(`[Chat Import] 📤 Body da requisição:`, JSON.stringify(requestBody, null, 2));

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

    console.log(`[Chat Import] 📋 Response Status: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`[Chat Import] 📋 Response Body (primeiros 500 chars):`, responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[Chat Import] ❌ Erro ao fazer parse da resposta:`, parseError);
      data = { raw: responseText, parseError: parseError.message };
    }

    if (!response.ok) {
      console.error(`[Chat Import] ❌ Resposta HTTP não OK:`, response.status, data);
      throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`[Chat Import] ✅ Resposta VPS recebida com sucesso:`, {
      contactsCount: data.contacts?.length || 0,
      messagesCount: data.messages?.length || 0
    });

    // Processar contatos se existirem
    let contactsImported = 0;
    if (data.contacts && Array.isArray(data.contacts)) {
      console.log(`[Chat Import] 👥 Processando ${data.contacts.length} contatos`);
      
      for (const contact of data.contacts) {
        try {
          const cleanPhone = cleanPhoneNumber(contact.id || contact.phone || '');
          if (!cleanPhone) {
            console.warn(`[Chat Import] ⚠️ Contato sem telefone válido:`, contact);
            continue;
          }

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
              console.log(`[Chat Import] ✅ Contato salvo: ${cleanPhone}`);
            } else {
              console.error(`[Chat Import] ❌ Erro ao salvar contato ${cleanPhone}:`, error);
            }
          } else {
            console.log(`[Chat Import] ℹ️ Contato já existe: ${cleanPhone}`);
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
          if (!phoneNumber) {
            console.warn(`[Chat Import] ⚠️ Mensagem sem telefone:`, message);
            continue;
          }

          const cleanPhone = cleanPhoneNumber(phoneNumber.replace('@c.us', ''));
          if (!cleanPhone) {
            console.warn(`[Chat Import] ⚠️ Telefone inválido após limpeza: ${phoneNumber}`);
            continue;
          }

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
              console.warn(`[Chat Import] ⚠️ Erro ao criar lead para ${cleanPhone}:`, leadError);
              continue;
            }
            leadId = newLead.id;
            console.log(`[Chat Import] ✅ Lead criado: ${cleanPhone} -> ${leadId}`);
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
              if (messagesImported % 10 === 0) {
                console.log(`[Chat Import] 📊 ${messagesImported} mensagens processadas...`);
              }
            } else {
              console.error(`[Chat Import] ❌ Erro ao salvar mensagem:`, error);
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
    console.error(`[Chat Import] ❌ Stack trace:`, error.stack);
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
        // CORREÇÃO CRÍTICA: Action para importação automática via webhook
        const { instanceId, vpsInstanceId } = body;
        
        console.log(`[Chat Import] 🔍 Parâmetros recebidos:`, { instanceId, vpsInstanceId });
        
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
          console.error(`[Chat Import] ❌ Instância não encontrada:`, { instanceId, vpsInstanceId, error: instanceError });
          return new Response(
            JSON.stringify({ success: false, error: 'Instância não encontrada' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[Chat Import] ✅ Instância encontrada:`, {
          id: instance.id,
          name: instance.instance_name,
          vpsInstanceId: instance.vps_instance_id
        });

        console.log(`[Chat Import] 🚀 Importação automática iniciada para: ${instance.instance_name}`);

        // CORREÇÃO: Usar a função importHistoryFromVPS corretamente
        const result = await importHistoryFromVPS(supabase, instance, 'both', 25);

        // Atualizar timestamp
        await supabase
          .from('whatsapp_instances')
          .update({
            last_sync_at: new Date().toISOString(),
            history_imported: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', instance.id);

        console.log(`[Chat Import] ✅ Importação automática concluída:`, {
          contactsImported: result.contactsImported,
          messagesImported: result.messagesImported,
          totalImported: result.contactsImported + result.messagesImported
        });

        return new Response(
          JSON.stringify({
            success: result.success,
            message: result.message || 'Importação automática concluída',
            contactsImported: result.contactsImported,
            messagesImported: result.messagesImported,
            totalImported: result.contactsImported + result.messagesImported,
            error: result.success ? undefined : result.error
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
