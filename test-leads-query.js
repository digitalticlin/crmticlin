// Script de teste para executar no console do navegador
// Execute este script na página /debug-sales-funnel

async function testLeadsQuery() {
  console.log('🔍 Testando consulta de leads...');
  
  // Obter usuário atual
  const { data: { user }, error: userError } = await window.supabase.auth.getUser();
  if (userError || !user) {
    console.error('❌ Erro ao obter usuário:', userError);
    return;
  }
  
  console.log('👤 Usuário atual:', {
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role
  });
  
  const isAdmin = user.user_metadata?.role === 'admin' || user.email === 'inacio@ticlin.com.br';
  console.log('🔑 É admin?', isAdmin);
  
  // 1. Testar consulta básica - TODOS os leads
  console.log('\n1️⃣ Testando consulta básica - TODOS OS LEADS:');
  const { data: allLeads, error: allLeadsError } = await window.supabase
    .from('leads')
    .select('*')
    .eq('created_by_user_id', user.id);
  
  console.log('Resultado:', {
    count: allLeads?.length || 0,
    error: allLeadsError,
    sample: allLeads?.slice(0, 2)
  });
  
  // 2. Verificar funis
  console.log('\n2️⃣ Testando funis do usuário:');
  const { data: funnels, error: funnelsError } = await window.supabase
    .from('funnels')
    .select('*')
    .eq('created_by_user_id', user.id);
  
  console.log('Funis:', {
    count: funnels?.length || 0,
    error: funnelsError,
    data: funnels
  });
  
  // 3. Se há funil, testar leads do funil
  if (funnels && funnels.length > 0) {
    const firstFunnel = funnels[0];
    console.log('\n3️⃣ Testando leads do primeiro funil:', firstFunnel.name);
    
    // Query exata do hook
    const { data: funnelLeads, error: funnelError } = await window.supabase
      .from('leads')
      .select(`
        id, name, phone, email, company, notes, 
        last_message, last_message_time, purchase_value, 
        unread_count, owner_id, kanban_stage_id, funnel_id,
        whatsapp_number_id, created_at, updated_at, profile_pic_url,
        conversation_status, created_by_user_id,
        lead_tags(
          tag_id,
          tags:tag_id(
            id,
            name,
            color
          )
        )
      `)
      .eq('funnel_id', firstFunnel.id)
      .eq('created_by_user_id', user.id)
      .in('conversation_status', ['active', 'closed'])
      .order('updated_at', { ascending: false });
    
    console.log('Leads do funil (query atual):', {
      count: funnelLeads?.length || 0,
      error: funnelError,
      sample: funnelLeads?.slice(0, 2)
    });
    
    // Query sem filtro de conversation_status
    console.log('\n4️⃣ Testando SEM filtro conversation_status:');
    const { data: funnelLeadsNoFilter, error: noFilterError } = await window.supabase
      .from('leads')
      .select('id, name, phone, conversation_status, funnel_id')
      .eq('funnel_id', firstFunnel.id)
      .eq('created_by_user_id', user.id);
    
    console.log('Leads sem filtro de status:', {
      count: funnelLeadsNoFilter?.length || 0,
      error: noFilterError,
      statusBreakdown: funnelLeadsNoFilter?.reduce((acc, lead) => {
        acc[lead.conversation_status || 'null'] = (acc[lead.conversation_status || 'null'] || 0) + 1;
        return acc;
      }, {})
    });
  }
  
  // 5. Verificar leads órfãos (sem funnel_id)
  console.log('\n5️⃣ Testando leads órfãos (sem funnel_id):');
  const { data: orphanLeads, error: orphanError } = await window.supabase
    .from('leads')
    .select('id, name, phone, funnel_id, conversation_status')
    .eq('created_by_user_id', user.id)
    .is('funnel_id', null);
  
  console.log('Leads órfãos:', {
    count: orphanLeads?.length || 0,
    error: orphanError,
    sample: orphanLeads?.slice(0, 3)
  });
  
  console.log('\n✅ Teste completo!');
}

// Auto-executar quando script for colado
testLeadsQuery().catch(console.error);