/**
 * Script para analisar RLS da tabela kanban_stages
 * Execute: node debug_rls_analysis.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rhjgagzstjzynvrakdyj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0._trCzQxDz5wCHs6NlrXRPAJNqfCRQM4s8NhkX5xEn4w';

if (!SUPABASE_ANON_KEY) {
  console.error('VITE_SUPABASE_ANON_KEY não encontrada. Configure no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function analyzeRLS() {
  console.log('🔍 ANÁLISE RLS - kanban_stages');
  console.log('==============================\n');

  try {
    // 1. Ver todas as políticas RLS da tabela kanban_stages
    console.log('1. 📋 POLÍTICAS RLS ATIVAS:');
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies
          WHERE tablename = 'kanban_stages'
          ORDER BY policyname;
        `
      });

    if (policiesError) {
      console.log('⚠️ Erro ao buscar políticas:', policiesError);
    } else {
      console.table(policies);
    }

    // 2. Verificar se RLS está ativado
    console.log('\n2. 🔐 STATUS RLS:');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            relname as table_name,
            relrowsecurity as rls_enabled,
            relforcerowsecurity as rls_forced
          FROM pg_class
          WHERE relname = 'kanban_stages';
        `
      });

    if (rlsError) {
      console.log('⚠️ Erro ao verificar RLS:', rlsError);
    } else {
      console.table(rlsStatus);
    }

    // 3. Análise de dados do funil operacional
    console.log('\n3. 📊 DADOS DO FUNIL OPERACIONAL:');
    const { data: funnelData, error: funnelError } = await supabase
      .from('kanban_stages')
      .select(`
        funnel_id,
        COUNT(*) as total_stages,
        funnels!inner(name, created_by_user_id)
      `)
      .eq('funnel_id', '28dfc9bb-3c5c-482c-aca6-805a5c2bf280')
      .group('funnel_id, funnels.name, funnels.created_by_user_id');

    if (funnelError) {
      console.log('⚠️ Erro ao buscar dados do funil:', funnelError);
    } else {
      console.table(funnelData);
    }

    // 4. Verificar permissões do usuário operacional
    console.log('\n4. 👤 PERMISSÕES USUÁRIO OPERACIONAL:');
    const { data: userPermissions, error: permError } = await supabase
      .from('user_funnels')
      .select(`
        profile_id,
        funnel_id,
        funnels!inner(name, created_by_user_id),
        profiles!inner(email)
      `)
      .eq('profile_id', 'd0bdb8e2-556f-48da-af90-63f14c119340');

    if (permError) {
      console.log('⚠️ Erro ao buscar permissões:', permError);
    } else {
      console.table(userPermissions);
    }

    // 5. Simular query que o operacional faria
    console.log('\n5. 🎯 SIMULAÇÃO QUERY OPERACIONAL:');
    const { data: operationalQuery, error: opError } = await supabase
      .from('kanban_stages')
      .select('id, title, funnel_id')
      .in('funnel_id', ['28dfc9bb-3c5c-482c-aca6-805a5c2bf280'])
      .limit(5);

    if (opError) {
      console.log('⚠️ Query operacional falhou:', opError);
    } else {
      console.log(`✅ Query operacional retornou ${operationalQuery.length} etapas`);
      console.table(operationalQuery);
    }

  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

analyzeRLS();