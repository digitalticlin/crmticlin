/**
 * Script para analisar RLS da tabela kanban_stages
 * Execute: node debug_rls_analysis.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rhjgagzstjzynvrakdyj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0._trCzQxDz5wCHs6NlrXRPAJNqfCRQM4s8NhkX5xEn4w';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function analyzeRLS() {
  console.log('🔍 ANÁLISE RLS - kanban_stages');
  console.log('==============================\n');

  try {
    // 1. Verificar se RLS está ativado na tabela
    console.log('1. 🔐 STATUS RLS na tabela kanban_stages:');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'kanban_stages');
    
    if (tableError) {
      console.log('⚠️ Erro ao verificar tabela:', tableError);
    } else {
      console.log('✅ Tabela kanban_stages existe');
    }

    // 2. Teste direto - buscar algumas etapas sem filtro
    console.log('\n2. 🎯 TESTE DIRETO - Buscar etapas:');
    const { data: allStages, error: allError } = await supabase
      .from('kanban_stages')
      .select('id, title, funnel_id, created_by_user_id')
      .limit(5);

    if (allError) {
      console.log('❌ Query direta falhou:', allError);
      console.log('Detalhes do erro:');
      console.log('- Código:', allError.code);
      console.log('- Mensagem:', allError.message);
      console.log('- Hint:', allError.hint);
    } else {
      console.log(`✅ Query direta retornou ${allStages.length} etapas`);
      if (allStages.length > 0) {
        console.table(allStages);
      }
    }

    // 3. Buscar dados do funil específico
    console.log('\n3. 📊 DADOS DO FUNIL OPERACIONAL (28dfc9bb-3c5c-482c-aca6-805a5c2bf280):');
    const { data: funnelStages, error: funnelError } = await supabase
      .from('kanban_stages')
      .select('id, title, order_position, funnel_id, created_by_user_id')
      .eq('funnel_id', '28dfc9bb-3c5c-482c-aca6-805a5c2bf280');

    if (funnelError) {
      console.log('❌ Query do funil falhou:', funnelError);
      console.log('Detalhes do erro:');
      console.log('- Código:', funnelError.code);
      console.log('- Mensagem:', funnelError.message);
    } else {
      console.log(`✅ Funil tem ${funnelStages.length} etapas`);
      if (funnelStages.length > 0) {
        console.table(funnelStages);
      }
    }

    // 4. Verificar permissões via user_funnels
    console.log('\n4. 👤 PERMISSÕES VIA user_funnels:');
    const { data: userFunnels, error: permError } = await supabase
      .from('user_funnels')
      .select('profile_id, funnel_id')
      .eq('profile_id', 'd0bdb8e2-556f-48da-af90-63f14c119340');

    if (permError) {
      console.log('❌ Erro ao buscar user_funnels:', permError);
    } else {
      console.log(`✅ Usuário operacional tem ${userFunnels.length} funis atribuídos`);
      console.table(userFunnels);
    }

    // 5. Verificar dados do funil
    console.log('\n5. 📋 DADOS DO FUNIL:');
    const { data: funnelInfo, error: funnelInfoError } = await supabase
      .from('funnels')
      .select('id, name, created_by_user_id')
      .eq('id', '28dfc9bb-3c5c-482c-aca6-805a5c2bf280');

    if (funnelInfoError) {
      console.log('❌ Erro ao buscar funil:', funnelInfoError);
    } else {
      console.log('✅ Dados do funil:');
      console.table(funnelInfo);
    }

    // 6. Tentar query com join (como fazia antes)
    console.log('\n6. 🔗 TESTE COM JOIN (funnels + kanban_stages):');
    const { data: joinData, error: joinError } = await supabase
      .from('funnels')
      .select(`
        id,
        name,
        kanban_stages (
          id,
          title,
          order_position
        )
      `)
      .eq('id', '28dfc9bb-3c5c-482c-aca6-805a5c2bf280');

    if (joinError) {
      console.log('❌ Query com JOIN falhou:', joinError);
      console.log('Detalhes do erro:');
      console.log('- Código:', joinError.code);
      console.log('- Mensagem:', joinError.message);
    } else {
      console.log('✅ Query com JOIN funcionou:');
      console.table(joinData);
      if (joinData.length > 0 && joinData[0].kanban_stages) {
        console.log('📋 Etapas encontradas via JOIN:');
        console.table(joinData[0].kanban_stages);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral na análise:', error);
  }
}

analyzeRLS();