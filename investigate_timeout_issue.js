/**
 * INVESTIGAÇÃO DO TIMEOUT NA DELEÇÃO DE INSTÂNCIAS
 * Script para verificar a causa real do problema antes de aplicar correções
 */

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = 'https://rhjgagzstjzynvrakdyj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0._trCzQxDz5wCHs6NlrXRPAJNqfCRQM4s8NhkX5xEn4w';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function investigateTimeoutIssue() {
  console.log('🔍 INVESTIGANDO PROBLEMA DE TIMEOUT NA DELEÇÃO');
  console.log('===============================================\n');

  try {
    // 1. VERIFICAR TRIGGERS ATIVOS NA TABELA whatsapp_instances
    console.log('1. 📋 VERIFICANDO TRIGGERS ATIVOS...');
    const { data: triggers, error: triggersError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT 
            trigger_name,
            event_manipulation,
            event_object_table,
            action_timing,
            action_statement,
            trigger_schema
          FROM information_schema.triggers 
          WHERE event_object_table = 'whatsapp_instances'
          ORDER BY trigger_name;
        `
      });

    if (triggersError) {
      console.log('⚠️ Não foi possível verificar triggers via RPC, tentando método alternativo...');
      
      // Método alternativo: verificar na documentação/arquivos
      const fs = await import('fs');
      const triggerContent = fs.readFileSync('./auto-delete-trigger.sql', 'utf8');
      console.log('📄 Conteúdo do trigger encontrado no arquivo:');
      console.log(triggerContent.split('\n').slice(0, 10).join('\n') + '...\n');
      
    } else {
      console.log('✅ Triggers encontrados:', triggers);
    }

    // 2. VERIFICAR ÍNDICES NA TABELA
    console.log('2. 📊 VERIFICANDO ÍNDICES...');
    const { data: indexes, error: indexError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT 
            indexname,
            indexdef,
            tablename
          FROM pg_indexes 
          WHERE tablename = 'whatsapp_instances'
          ORDER BY indexname;
        `
      });

    if (indexError) {
      console.log('⚠️ Erro ao verificar índices:', indexError.message);
    } else {
      console.log('✅ Índices encontrados:', indexes);
    }

    // 3. VERIFICAR FOREIGN KEYS E CONSTRAINTS
    console.log('\n3. 🔗 VERIFICANDO FOREIGN KEYS...');
    const { data: constraints, error: constraintError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT 
            constraint_name,
            constraint_type,
            table_name,
            column_name
          FROM information_schema.key_column_usage
          JOIN information_schema.table_constraints USING (constraint_name)
          WHERE table_name = 'whatsapp_instances'
          ORDER BY constraint_name;
        `
      });

    if (constraintError) {
      console.log('⚠️ Erro ao verificar constraints:', constraintError.message);
    } else {
      console.log('✅ Constraints encontradas:', constraints);
    }

    // 4. VERIFICAR ESTATÍSTICAS DA TABELA
    console.log('\n4. 📈 VERIFICANDO ESTATÍSTICAS DA TABELA...');
    const { data: tableStats, error: statsError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_tuples,
            n_dead_tup as dead_tuples,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
          FROM pg_stat_user_tables
          WHERE tablename = 'whatsapp_instances';
        `
      });

    if (statsError) {
      console.log('⚠️ Erro ao verificar estatísticas:', statsError.message);
    } else {
      console.log('✅ Estatísticas da tabela:', tableStats);
    }

    // 5. CONTAR REGISTROS NA TABELA
    console.log('\n5. 🔢 CONTANDO REGISTROS...');
    const { count, error: countError } = await supabase
      .from('whatsapp_instances')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('⚠️ Erro ao contar registros:', countError.message);
    } else {
      console.log('✅ Total de registros na tabela:', count);
    }

    // 6. VERIFICAR ÚLTIMAS INSTÂNCIAS CRIADAS
    console.log('\n6. 📅 VERIFICANDO ÚLTIMAS INSTÂNCIAS...');
    const { data: recentInstances, error: recentError } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_name, created_at, connection_status, vps_instance_id')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.log('⚠️ Erro ao buscar instâncias recentes:', recentError.message);
    } else {
      console.log('✅ Últimas 5 instâncias:');
      recentInstances?.forEach(instance => {
        console.log(`  - ${instance.instance_name} (${instance.id}) - ${instance.connection_status}`);
      });
    }

    console.log('\n🎯 CONCLUSÃO DA INVESTIGAÇÃO:');
    console.log('===============================');
    
    if (triggersError && indexError) {
      console.log('❌ NÃO foi possível verificar completamente via API');
      console.log('📝 RECOMENDAÇÃO: Execute as consultas diretamente no SQL Editor do Supabase');
      console.log('🔗 https://supabase.com/dashboard/project/rhjgagzstjzynvrakdyj/sql');
    } else {
      console.log('✅ Investigação concluída com dados coletados');
    }

  } catch (error) {
    console.error('❌ ERRO DURANTE A INVESTIGAÇÃO:', error);
    console.log('\n📋 PRÓXIMOS PASSOS MANUAIS:');
    console.log('1. Acesse o Supabase SQL Editor');
    console.log('2. Execute as consultas do arquivo: fix_delete_timeout_issue.sql');
    console.log('3. Verifique se o trigger after_delete_whatsapp_instance existe');
  }
}

// Executar investigação
investigateTimeoutIssue();