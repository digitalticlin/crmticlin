// Script para verificar as colunas disponíveis na tabela ai_agent_prompts via information_schema
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rhjgagzstjzynvrakdyj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0._trCzQxDz5wCHs6NlrXRPAJNqfCRQM4s8NhkX5xEn4w";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkColumns() {
  console.log('🔍 VERIFICANDO COLUNAS DA TABELA ai_agent_prompts VIA SQL');
  console.log('=' .repeat(70));
  
  try {
    // Usar uma função RPC personalizada para verificar colunas se disponível
    // ou verificar diretamente via tentativas de select
    
    console.log('\n📋 TESTANDO COLUNAS CONFORME TYPES.TS:');
    
    const knownColumns = [
      'id',
      'agent_id',
      'agent_function', 
      'communication_style',
      'company_info',
      'product_service_info',
      'prohibitions',
      'objectives',
      'created_by_user_id',
      'created_at',
      'updated_at'
    ];
    
    const existingColumns = [];
    const missingColumns = [];
    
    // Testar cada coluna individualmente
    for (const column of knownColumns) {
      try {
        const { data, error } = await supabase
          .from('ai_agent_prompts')
          .select(column)
          .limit(0); // Não buscar dados, apenas testar se a coluna existe
        
        if (error) {
          // Verificar se o erro é relacionado à coluna não existir
          if (error.message.includes('column') && error.message.includes('does not exist')) {
            console.log(`❌ ${column}: NÃO EXISTE`);
            missingColumns.push(column);
          } else if (error.message.includes('schema cache')) {
            console.log(`⚠️ ${column}: ERRO DE CACHE - ${error.message}`);
            missingColumns.push(column);
          } else {
            console.log(`✅ ${column}: EXISTE (erro RLS: ${error.message.substring(0, 50)}...)`);
            existingColumns.push(column);
          }
        } else {
          console.log(`✅ ${column}: EXISTE`);
          existingColumns.push(column);
        }
      } catch (err) {
        console.log(`❌ ${column}: ERRO - ${err.message}`);
        missingColumns.push(column);
      }
      
      // Pequeno delay para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 RESUMO:');
    console.log(`✅ COLUNAS EXISTENTES (${existingColumns.length}):`, existingColumns);
    console.log(`❌ COLUNAS AUSENTES (${missingColumns.length}):`, missingColumns);
    
    console.log('\n🔍 TESTANDO POSSÍVEIS COLUNAS ADICIONAIS:');
    
    const possibleNewColumns = [
      'agent_objective',
      'communication_style_examples',
      'products_services_examples', 
      'rules_guidelines',
      'rules_guidelines_examples',
      'prohibitions_examples',
      'client_objections',
      'client_objections_examples',
      'phrase_tips',
      'phrase_tips_examples',
      'flow'
    ];
    
    const newExistingColumns = [];
    const newMissingColumns = [];
    
    for (const column of possibleNewColumns) {
      try {
        const { data, error } = await supabase
          .from('ai_agent_prompts')
          .select(column)
          .limit(0);
        
        if (error) {
          if (error.message.includes('column') || error.message.includes('schema cache')) {
            console.log(`❌ ${column}: NÃO EXISTE`);
            newMissingColumns.push(column);
          } else {
            console.log(`✅ ${column}: EXISTE (erro RLS)`);
            newExistingColumns.push(column);
          }
        } else {
          console.log(`✅ ${column}: EXISTE`);
          newExistingColumns.push(column);
        }
      } catch (err) {
        console.log(`❌ ${column}: ERRO - ${err.message}`);
        newMissingColumns.push(column);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 COLUNAS ADICIONAIS:');
    console.log(`✅ NOVAS EXISTENTES (${newExistingColumns.length}):`, newExistingColumns);
    console.log(`❌ NOVAS AUSENTES (${newMissingColumns.length}):`, newMissingColumns);
    
    console.log('\n🎯 ANÁLISE FINAL:');
    console.log(`Total de colunas básicas funcionais: ${existingColumns.length}/11`);
    console.log(`Total de colunas adicionais funcionais: ${newExistingColumns.length}/11`);
    
    const allExisting = [...existingColumns, ...newExistingColumns];
    const allMissing = [...missingColumns, ...newMissingColumns];
    
    console.log(`\n📈 COBERTURA GERAL: ${allExisting.length}/${allExisting.length + allMissing.length} colunas (${Math.round(allExisting.length / (allExisting.length + allMissing.length) * 100)}%)`);
    
  } catch (err) {
    console.error('💥 ERRO FATAL:', err);
  }
}

checkColumns();