
import { corsHeaders } from './config.ts';

export async function getChatHistory(supabase: any, chatData: any, userId: string) {
  const historyId = `history_${Date.now()}`;
  console.log(`[Chat History] 📚 FASE 2.0 - Buscando histórico [${historyId}]:`, {
    instanceId: chatData.instanceId,
    leadId: chatData.leadId
  });

  try {
    const { instanceId, leadId, limit = 50, offset = 0 } = chatData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    console.log(`[Chat History] 🔍 FASE 2.0 - Validando acesso [${historyId}]`);

    // 1. Verificar se usuário tem acesso à instância
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, company_id')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      console.error(`[Chat History] ❌ FASE 2.0 - Sem acesso à instância:`, instanceError);
      throw new Error('Instância não encontrada ou sem permissão');
    }

    // 2. Buscar mensagens
    let query = supabase
      .from('messages')
      .select(`
        id,
        text,
        from_me,
        timestamp,
        status,
        media_type,
        media_url,
        external_id,
        lead_id,
        leads!inner(id, name, phone)
      `)
      .eq('whatsapp_number_id', instanceId)
      .order('timestamp', { ascending: true });

    // Filtrar por lead específico se fornecido
    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    // Paginação
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error(`[Chat History] ❌ FASE 2.0 - Erro ao buscar mensagens:`, messagesError);
      throw messagesError;
    }

    console.log(`[Chat History] ✅ FASE 2.0 - Mensagens encontradas [${historyId}]:`, {
      total: messages?.length || 0,
      leadId,
      instanceId
    });

    // 3. Buscar contatos (leads) se não específico
    let contacts = [];
    if (!leadId) {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('whatsapp_number_id', instanceId)
        .order('last_message_time', { ascending: false });

      if (!leadsError && leadsData) {
        contacts = leadsData;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          messages: messages || [],
          contacts: contacts,
          pagination: {
            limit,
            offset,
            total: messages?.length || 0
          }
        },
        historyId,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Chat History] 💥 FASE 2.0 - ERRO CRÍTICO [${historyId}]:`, {
      error: error.message,
      stack: error.stack,
      chatData
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        historyId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
