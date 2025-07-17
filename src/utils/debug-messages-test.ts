/**
 * 🔍 SCRIPT DE DEBUG PARA MENSAGENS
 * 
 * Execute este script no console do navegador para diagnosticar problemas
 */

// 🚀 FUNCTION: Testar query direta de mensagens
export const testMessagesQuery = async (leadId: string, instanceId?: string) => {
  console.log('🧪 TESTE: Query direta de mensagens');
  console.log('Lead ID:', leadId);
  console.log('Instance ID:', instanceId);
  
  // Importar Supabase
  const { supabase } = await import('@/integrations/supabase/client');
  
  try {
    // Query básica sem filtros
    console.log('\n1️⃣ TESTE: Query básica (todas as mensagens do lead)');
    let query = supabase
      .from('messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('timestamp', { ascending: false })
      .limit(10);

    const { data: allMessages, error: allError } = await query;
    
    console.log('Resultado:', {
      sucesso: !allError,
      erro: allError?.message,
      totalMensagens: allMessages?.length || 0,
      mensagens: allMessages?.map(m => ({
        id: m.id,
        text: m.text?.substring(0, 50) + '...',
        from_me: m.from_me,
        timestamp: m.timestamp,
        whatsapp_number_id: m.whatsapp_number_id
      }))
    });

    // Query com filtro de instância
    if (instanceId) {
      console.log('\n2️⃣ TESTE: Query com filtro de instância');
      const { data: filteredMessages, error: filteredError } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .eq('whatsapp_number_id', instanceId)
        .order('timestamp', { ascending: false })
        .limit(10);

      console.log('Resultado filtrado:', {
        sucesso: !filteredError,
        erro: filteredError?.message,
        totalMensagens: filteredMessages?.length || 0,
        mensagens: filteredMessages?.map(m => ({
          id: m.id,
          text: m.text?.substring(0, 50) + '...',
          from_me: m.from_me,
          timestamp: m.timestamp
        }))
      });
    }

    return { allMessages, filteredMessages: instanceId ? undefined : null };

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return null;
  }
};

// 🚀 FUNCTION: Testar conexão realtime
export const testRealtimeConnection = async (leadId: string) => {
  console.log('\n🧪 TESTE: Conexão Realtime');
  
  const { supabase } = await import('@/integrations/supabase/client');
  
  const channel = supabase
    .channel(`test-messages-${leadId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `lead_id=eq.${leadId}`
    }, (payload) => {
      console.log('📨 Evento realtime capturado:', payload);
    })
    .subscribe((status) => {
      console.log('📡 Status da subscription:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime conectado! Aguardando eventos...');
      }
    });

  // Auto-cleanup após 30 segundos
  setTimeout(() => {
    supabase.removeChannel(channel);
    console.log('🧹 Canal de teste removido');
  }, 30000);

  return channel;
};

// 🚀 FUNCTION: Verificar estrutura da tabela
export const checkTableStructure = async () => {
  console.log('\n🧪 TESTE: Estrutura da tabela messages');
  
  const { supabase } = await import('@/integrations/supabase/client');
  
  try {
    // Buscar uma mensagem exemplo
    const { data: sampleMessage, error } = await supabase
      .from('messages')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar mensagem exemplo:', error);
      return;
    }

    console.log('✅ Estrutura da tabela (exemplo):', {
      colunas: Object.keys(sampleMessage || {}),
      dadosExemplo: sampleMessage
    });

    return sampleMessage;
  } catch (error) {
    console.error('❌ Erro no teste de estrutura:', error);
  }
};

// 🚀 FUNCTION: Verificar leads existentes
export const checkLeadsWithMessages = async () => {
  console.log('\n🧪 TESTE: Leads com mensagens');
  
  const { supabase } = await import('@/integrations/supabase/client');
  
  try {
    const { data: leadsWithMessages, error } = await supabase
      .from('leads')
      .select(`
        id,
        name,
        phone,
        last_message,
        last_message_time,
        unread_count,
        whatsapp_number_id,
        messages:messages(count)
      `)
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar leads:', error);
      return;
    }

    console.log('✅ Leads com mensagens:', leadsWithMessages?.map(lead => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      totalMensagens: lead.messages?.[0]?.count || 0,
      ultimaMensagem: lead.last_message,
      instanciaId: lead.whatsapp_number_id
    })));

    return leadsWithMessages;
  } catch (error) {
    console.error('❌ Erro no teste de leads:', error);
  }
};

// 🚀 FUNCTION: Script completo de diagnóstico
export const runCompleteTest = async (leadId?: string) => {
  console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DE MENSAGENS\n');
  
  // 1. Verificar estrutura
  await checkTableStructure();
  
  // 2. Verificar leads
  const leads = await checkLeadsWithMessages();
  
  // 3. Se leadId fornecido, testar mensagens específicas
  if (leadId) {
    await testMessagesQuery(leadId);
    await testRealtimeConnection(leadId);
  } else if (leads && leads.length > 0) {
    // Usar primeiro lead com mensagens
    const leadComMensagens = leads.find(l => l.messages?.[0]?.count > 0);
    if (leadComMensagens) {
      console.log(`\n🎯 Testando com lead: ${leadComMensagens.name} (${leadComMensagens.id})`);
      await testMessagesQuery(leadComMensagens.id, leadComMensagens.whatsapp_number_id);
      await testRealtimeConnection(leadComMensagens.id);
    }
  }
  
  console.log('\n✅ Diagnóstico completo finalizado!');
};

// Exportar para uso no console
if (typeof window !== 'undefined') {
  (window as any).debugMessages = {
    testMessagesQuery,
    testRealtimeConnection,
    checkTableStructure,
    checkLeadsWithMessages,
    runCompleteTest
  };
  
  console.log('🔧 Scripts de debug disponíveis em window.debugMessages');
} 