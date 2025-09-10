// Script para testar a estrutura real da tabela ai_agent_prompts no Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rhjgagzstjzynvrakdyj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0._trCzQxDz5wCHs6NlrXRPAJNqfCRQM4s8NhkX5xEn4w";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSchema() {
  console.log('🔍 TESTANDO ESTRUTURA DA TABELA ai_agent_prompts');
  console.log('=' .repeat(60));
  
  try {
    // Tentar uma query de teste para ver as colunas disponíveis
    const { data, error } = await supabase
      .from('ai_agent_prompts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ ERRO na query:', error);
      
      // Tentar uma query mais específica para identificar colunas problemáticas
      console.log('\n🔍 TESTANDO COLUNAS INDIVIDUAIS:');
      
      const basicColumns = [
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
      
      for (const column of basicColumns) {
        try {
          const { data: testData, error: testError } = await supabase
            .from('ai_agent_prompts')
            .select(column)
            .limit(1);
            
          if (testError) {
            console.log(`❌ ${column}: NÃO EXISTE - ${testError.message}`);
          } else {
            console.log(`✅ ${column}: EXISTE`);
          }
        } catch (err) {
          console.log(`❌ ${column}: ERRO - ${err.message}`);
        }
      }
    } else {
      console.log('✅ QUERY BÁSICA FUNCIONOU!');
      console.log('📊 ESTRUTURA ENCONTRADA:');
      
      if (data && data.length > 0) {
        const sample = data[0];
        Object.keys(sample).forEach(key => {
          const value = sample[key];
          const type = typeof value;
          console.log(`  ✅ ${key}: ${type} ${value === null ? '(NULL)' : ''}`);
        });
      } else {
        console.log('📝 Tabela existe mas está vazia');
        
        // Vamos tentar inserir um registro de teste para ver quais colunas são aceitas
        console.log('\n🧪 TESTANDO INSERT COM DADOS MÍNIMOS:');
        
        const testData = {
          agent_id: '00000000-0000-0000-0000-000000000000', // UUID fictício
          agent_function: 'Teste de estrutura',
          communication_style: 'Teste',
          created_by_user_id: '00000000-0000-0000-0000-000000000001'
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('ai_agent_prompts')
          .insert(testData)
          .select();
          
        if (insertError) {
          console.log('❌ INSERT FALHOU:', insertError.message);
          console.log('💡 Isso nos dá pistas sobre as colunas obrigatórias');
        } else {
          console.log('✅ INSERT FUNCIONOU!');
          console.log('📊 DADOS INSERIDOS:', insertData);
          
          // Limpar o registro de teste
          if (insertData && insertData.length > 0) {
            await supabase
              .from('ai_agent_prompts')
              .delete()
              .eq('id', insertData[0].id);
            console.log('🧹 Registro de teste removido');
          }
        }
      }
    }
  } catch (err) {
    console.error('💥 ERRO FATAL:', err.message);
  }
}

testSchema();