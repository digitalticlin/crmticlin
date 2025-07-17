// SCRIPT DE DEBUG REALTIME - FASE 1
// Execute este script no console do navegador para testar o realtime

console.log('🔬 [DEBUG REALTIME] Iniciando script de investigação...');

// Importar Supabase client
const { supabase } = window;

if (!supabase) {
  console.error('❌ Supabase client não encontrado!');
  console.log('Execute este script na página que tem o Supabase carregado');
} else {
  console.log('✅ Supabase client encontrado');
}

// TESTE 1: Verificar se Realtime está habilitado
async function testRealtimeConnection() {
  console.log('\n🧪 TESTE 1: Conexão Realtime');
  
  try {
    const channel = supabase.channel('debug-test-' + Date.now());
    
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public', 
      table: 'messages'
    }, (payload) => {
      console.log('📨 Evento capturado:', payload);
    });
    
    const subscription = await channel.subscribe();
    console.log('📡 Status da subscription:', subscription);
    
    if (subscription === 'SUBSCRIBED') {
      console.log('✅ Realtime conectado com sucesso!');
    } else {
      console.error('❌ Falha na conexão realtime:', subscription);
    }
    
    // Remover canal após teste
    setTimeout(() => {
      supabase.removeChannel(channel);
      console.log('🧹 Canal de teste removido');
    }, 5000);
    
  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error);
  }
}

// TESTE 2: Listar instâncias ativas
async function listActiveInstances() {
  console.log('\n🧪 TESTE 2: Instâncias Ativas');
  
  try {
    const { data: instances, error } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_name, connection_status, phone')
      .in('connection_status', ['ready', 'connected', 'open']);
    
    if (error) {
      console.error('❌ Erro ao buscar instâncias:', error);
      return [];
    }
    
    console.log('📱 Instâncias ativas encontradas:', instances?.length || 0);
    instances?.forEach((instance, index) => {
      console.log(`  ${index + 1}. ${instance.instance_name} (${instance.connection_status}) - ${instance.phone || 'Sem número'}`);
    });
    
    return instances || [];
  } catch (error) {
    console.error('❌ Erro:', error);
    return [];
  }
}

// TESTE 3: Listar contatos/leads
async function listContacts(instanceId) {
  console.log('\n🧪 TESTE 3: Contatos/Leads');
  
  if (!instanceId) {
    console.warn('⚠️ Sem instância ativa para listar contatos');
    return [];
  }
  
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, phone, last_message')
      .eq('whatsapp_number_id', instanceId)
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao buscar leads:', error);
      return [];
    }
    
    console.log('👤 Contatos encontrados:', leads?.length || 0);
    leads?.forEach((lead, index) => {
      console.log(`  ${index + 1}. ${lead.name} (${lead.phone}) - "${lead.last_message?.substring(0, 30) || 'Sem mensagem'}"`);
    });
    
    return leads || [];
  } catch (error) {
    console.error('❌ Erro:', error);
    return [];
  }
}

// TESTE 4: Monitorar eventos por 10 segundos
async function monitorEvents(instanceId) {
  console.log('\n🧪 TESTE 4: Monitor de Eventos (10 segundos)');
  
  if (!instanceId) {
    console.warn('⚠️ Sem instância para monitorar');
    return;
  }
  
  let eventCount = 0;
  const startTime = Date.now();
  
  console.log('📡 Iniciando monitoramento de eventos...');
  console.log('👀 Aguardando eventos de mensagens e leads...');
  
  const channel = supabase.channel('debug-monitor-' + Date.now());
  
  // Monitor de mensagens
  channel.on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'messages',
    filter: `whatsapp_number_id=eq.${instanceId}`
  }, (payload) => {
    eventCount++;
    const duration = Date.now() - startTime;
    console.log(`📨 [${duration}ms] MENSAGEM ${payload.eventType}:`, {
      id: payload.new?.id,
      text: payload.new?.text?.substring(0, 50),
      from_me: payload.new?.from_me,
      lead_id: payload.new?.lead_id
    });
  });
  
  // Monitor de leads
  channel.on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'leads',
    filter: `whatsapp_number_id=eq.${instanceId}`
  }, (payload) => {
    eventCount++;
    const duration = Date.now() - startTime;
    console.log(`👤 [${duration}ms] LEAD ${payload.eventType}:`, {
      id: payload.new?.id,
      name: payload.new?.name,
      last_message: payload.new?.last_message?.substring(0, 30)
    });
  });
  
  await channel.subscribe();
  
  // Parar após 10 segundos
  setTimeout(() => {
    supabase.removeChannel(channel);
    console.log(`\n📊 RESULTADO DO MONITORAMENTO:`);
    console.log(`   Duração: 10 segundos`);
    console.log(`   Eventos capturados: ${eventCount}`);
    
    if (eventCount === 0) {
      console.warn('⚠️ PROBLEMA: Nenhum evento foi capturado!');
      console.log('💡 Possíveis causas:');
      console.log('   - Realtime não está funcionando');
      console.log('   - Nenhuma mensagem chegou durante o teste');
      console.log('   - Filtros de subscription incorretos');
      console.log('   - Problemas de permissão RLS');
    } else {
      console.log('✅ Realtime está funcionando!');
    }
  }, 10000);
}

// TESTE 5: Inserir mensagem de teste
async function insertTestMessage(instanceId, leadId) {
  console.log('\n🧪 TESTE 5: Inserção de Mensagem de Teste');
  
  if (!instanceId || !leadId) {
    console.warn('⚠️ Precisa de instanceId e leadId para teste');
    return;
  }
  
  try {
    const testMessage = `Mensagem de teste - ${new Date().toLocaleTimeString()}`;
    
    console.log('💾 Inserindo mensagem de teste...');
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        lead_id: leadId,
        whatsapp_number_id: instanceId,
        text: testMessage,
        from_me: false,
        timestamp: new Date().toISOString(),
        status: 'received',
        created_by_user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao inserir mensagem:', error);
    } else {
      console.log('✅ Mensagem inserida com sucesso:', {
        id: data.id,
        text: data.text,
        lead_id: data.lead_id
      });
      console.log('👀 Verifique se um evento realtime foi capturado!');
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// EXECUTAR TODOS OS TESTES
async function runAllTests() {
  console.log('🚀 EXECUTANDO TODOS OS TESTES DE DEBUG...\n');
  
  // Teste 1: Conexão
  await testRealtimeConnection();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Teste 2: Instâncias
  const instances = await listActiveInstances();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (instances.length === 0) {
    console.warn('⚠️ Não é possível continuar sem instâncias ativas');
    return;
  }
  
  const activeInstance = instances[0];
  console.log(`🎯 Usando instância: ${activeInstance.instance_name}`);
  
  // Teste 3: Contatos
  const contacts = await listContacts(activeInstance.id);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Teste 4: Monitor (opcional - apenas se não quiser inserir mensagem)
  // await monitorEvents(activeInstance.id);
  
  // Teste 5: Inserir mensagem (se tiver contatos)
  if (contacts.length > 0) {
    const firstContact = contacts[0];
    console.log(`🎯 Usando contato: ${firstContact.name}`);
    
    // Iniciar monitor antes de inserir
    monitorEvents(activeInstance.id);
    
    // Aguardar 2 segundos e inserir mensagem
    setTimeout(() => {
      insertTestMessage(activeInstance.id, firstContact.id);
    }, 2000);
  }
}

// Exportar funções para uso manual
window.debugRealtime = {
  runAllTests,
  testRealtimeConnection,
  listActiveInstances,
  listContacts,
  monitorEvents,
  insertTestMessage
};

console.log('\n✅ Script carregado! Execute uma das funções:');
console.log('   debugRealtime.runAllTests() - Executar todos os testes');
console.log('   debugRealtime.testRealtimeConnection() - Testar apenas conexão');
console.log('   debugRealtime.monitorEvents(instanceId) - Monitorar eventos');
console.log('\n🚀 Executando teste automático em 3 segundos...');

// Auto-executar após 3 segundos
setTimeout(() => {
  runAllTests();
}, 3000); 