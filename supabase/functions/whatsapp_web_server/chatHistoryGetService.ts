
import { VPS_CONFIG } from './config.ts';
import { createVPSRequest } from './vpsRequestService.ts';

export async function getChatHistory(supabase: any, chatData: any) {
  console.log('[Chat History Get] 📚 Buscando histórico do chat:', chatData);
  
  try {
    const { instanceId, chatId, limit = 50, offset = 0 } = chatData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    // 1. Buscar instância no Supabase para validar acesso
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (instanceError || !instance) {
      throw new Error('Instância não encontrada');
    }

    console.log('[Chat History Get] 📋 Instância encontrada:', {
      instanceId: instance.id,
      vpsInstanceId: instance.vps_instance_id,
      instanceName: instance.instance_name
    });

    // 2. Se chatId específico, buscar do banco local primeiro
    if (chatId) {
      const { data: localMessages, error: localError } = await supabase
        .from('messages')
        .select(`
          *,
          leads!inner(
            id,
            name,
            phone
          )
        `)
        .eq('whatsapp_number_id', instanceId)
        .eq('leads.id', chatId)
        .order('timestamp', { ascending: false })
        .limit(limit)
        .offset(offset);

      if (!localError && localMessages && localMessages.length > 0) {
        console.log('[Chat History Get] ✅ Histórico local encontrado:', localMessages.length);
        
        return {
          success: true,
          data: {
            messages: localMessages,
            source: 'local',
            total: localMessages.length,
            hasMore: localMessages.length === limit
          }
        };
      }
    }

    // 3. Buscar da VPS se não encontrou localmente
    if (instance.vps_instance_id) {
      console.log('[Chat History Get] 🌐 Buscando da VPS:', instance.vps_instance_id);
      
      const vpsResult = await createVPSRequest(
        `/instance/${instance.vps_instance_id}/chats`,
        'GET'
      );

      if (vpsResult.success && vpsResult.data) {
        console.log('[Chat History Get] ✅ Histórico VPS obtido:', {
          chatsCount: vpsResult.data.chats?.length || 0,
          totalMessages: vpsResult.data.totalMessages || 0
        });

        // Filtrar por chatId se especificado
        let filteredChats = vpsResult.data.chats || [];
        if (chatId) {
          filteredChats = filteredChats.filter((chat: any) => 
            chat.id === chatId || chat.phone === chatId
          );
        }

        return {
          success: true,
          data: {
            chats: filteredChats,
            source: 'vps',
            total: filteredChats.length,
            totalMessages: vpsResult.data.totalMessages || 0
          }
        };
      }
    }

    // 4. Buscar do banco local sem filtro específico
    const { data: allMessages, error: allError } = await supabase
      .from('messages')
      .select(`
        *,
        leads!inner(
          id,
          name,
          phone
        )
      `)
      .eq('whatsapp_number_id', instanceId)
      .order('timestamp', { ascending: false })
      .limit(limit)
      .offset(offset);

    if (allError) {
      throw new Error(`Erro ao buscar mensagens: ${allError.message}`);
    }

    console.log('[Chat History Get] ✅ Histórico local geral obtido:', allMessages?.length || 0);

    return {
      success: true,
      data: {
        messages: allMessages || [],
        source: 'local_general',
        total: allMessages?.length || 0,
        hasMore: (allMessages?.length || 0) === limit
      }
    };

  } catch (error) {
    console.error('[Chat History Get] ❌ Erro ao buscar histórico:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
