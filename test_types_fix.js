// Script para testar se os types foram corrigidos
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rhjgagzstjzynvrakdyj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0._trCzQxDz5wCHs6NlrXRPAJNqfCRQM4s8NhkX5xEn4w";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testTypesFix() {
  console.log('🔧 TESTANDO CORREÇÃO DOS TYPES');
  console.log('=' .repeat(50));
  
  try {
    // Teste com as colunas corretas (sem objectives e product_service_info)
    const testData = {
      agent_id: '00000000-0000-0000-0000-000000000000',
      agent_function: 'Teste de correção dos types',
      agent_objective: 'Verificar se os types foram corrigidos',
      communication_style: 'Teste comunicação',
      communication_style_examples: [
        { id: '1', question: 'Teste?', answer: 'Resposta teste' }
      ],
      company_info: 'Empresa teste',
      products_services: 'Produtos teste',
      products_services_examples: [
        { id: '1', question: 'Produto?', answer: 'Temos produtos' }
      ],
      rules_guidelines: 'Regras teste',
      rules_guidelines_examples: [
        { id: '1', question: 'Regra?', answer: 'Seguir regras' }
      ],
      prohibitions: 'Proibições teste',
      prohibitions_examples: [
        { id: '1', question: 'Pode?', answer: 'Não pode' }
      ],
      client_objections: 'Objeções teste',
      client_objections_examples: [
        { id: '1', question: 'Caro', answer: 'Valor justo' }
      ],
      phrase_tips: 'Frases teste',
      phrase_tips_examples: [
        { id: '1', question: 'Frase', answer: 'Como usar' }
      ],
      flow: [
        { id: '1', description: 'Passo teste', examples: [], order: 1 }
      ],
      created_by_user_id: '00000000-0000-0000-0000-000000000001'
    };
    
    console.log('📝 TESTANDO INSERT COM ESTRUTURA CORRIGIDA...');
    
    const { data, error } = await supabase
      .from('ai_agent_prompts')
      .insert(testData)
      .select();
    
    if (error) {
      if (error.code === '42501') {
        console.log('✅ TYPES CORRIGIDOS! (Erro RLS esperado)');
        console.log('🔒 Row Level Security bloqueando inserção anônima');
        console.log('💡 Estrutura dos dados está correta!');
      } else if (error.message.includes('objectives') || error.message.includes('product_service_info')) {
        console.log('❌ TYPES AINDA NÃO CORRIGIDOS:');
        console.log('🔍 Erro:', error.message);
      } else {
        console.log('⚠️ OUTRO ERRO:');
        console.log('🔍 Detalhes:', error);
      }
    } else {
      console.log('✅ INSERT FUNCIONOU PERFEITAMENTE!');
      console.log('📊 Dados inseridos:', data);
    }
    
    console.log('\n🧪 TESTANDO SELECT SIMPLES...');
    
    const { data: selectData, error: selectError } = await supabase
      .from('ai_agent_prompts')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.log('❌ ERRO NO SELECT:', selectError.message);
    } else {
      console.log('✅ SELECT FUNCIONOU!');
      console.log('📊 Registros encontrados:', selectData?.length || 0);
    }
    
  } catch (err) {
    console.error('💥 ERRO FATAL:', err.message);
  }
}

testTypesFix();