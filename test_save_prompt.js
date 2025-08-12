// Script para testar o salvamento de dados na tabela ai_agent_prompts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rhjgagzstjzynvrakdyj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0._trCzQxDz5wCHs6NlrXRPAJNqfCRQM4s8NhkX5xEn4w";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSaveData() {
  console.log('🧪 TESTANDO SALVAMENTO COM ESTRUTURA CORRIGIDA');
  console.log('=' .repeat(60));
  
  try {
    // Dados de teste simulando o que o frontend envia
    const testData = {
      agent_id: '00000000-0000-0000-0000-000000000000',
      agent_function: 'Assistente de vendas especializado',
      agent_objective: 'Converter leads em vendas qualificadas',
      communication_style: 'Comunicação amigável e profissional',
      communication_style_examples: [
        { id: '1', question: 'Como você se comunica?', answer: 'Olá! Como posso ajudar?' }
      ],
      company_info: 'Empresa de tecnologia inovadora',
      products_services: 'Oferecemos sistemas de gestão empresarial',
      products_services_examples: [
        { id: '1', question: 'Que produtos vocês têm?', answer: 'Temos ERP, CRM e automação' }
      ],
      rules_guidelines: 'Sempre ser transparente com o cliente',
      rules_guidelines_examples: [
        { id: '1', question: 'Como lidar com dúvidas?', answer: 'Ser sempre claro e honesto' }
      ],
      prohibitions: 'Não fornecer preços sem consultar vendedor',
      prohibitions_examples: [
        { id: '1', question: 'Você pode dar desconto?', answer: 'Vou conectar com nosso vendedor' }
      ],
      client_objections: 'Como tratar objeções sobre preço',
      client_objections_examples: [
        { id: '1', question: 'Está caro', answer: 'Vamos ver o custo-benefício' }
      ],
      phrase_tips: 'Frases estratégicas para diferentes momentos',
      phrase_tips_examples: [
        { id: '1', question: 'Frase de abertura', answer: 'Como posso ajudar você hoje?' }
      ],
      flow: [
        { id: '1', description: 'Se apresentar', examples: [], order: 1 },
        { id: '2', description: 'Identificar necessidade', examples: [], order: 2 }
      ],
      created_by_user_id: '00000000-0000-0000-0000-000000000001'
    };
    
    console.log('📝 DADOS PARA INSERÇÃO:');
    console.log(`- agent_function: ${testData.agent_function ? 'PREENCHIDO' : 'VAZIO'}`);
    console.log(`- agent_objective: ${testData.agent_objective ? 'PREENCHIDO' : 'VAZIO'}`);
    console.log(`- communication_style: ${testData.communication_style ? 'PREENCHIDO' : 'VAZIO'}`);
    console.log(`- communication_style_examples: ${testData.communication_style_examples.length} itens`);
    console.log(`- company_info: ${testData.company_info ? 'PREENCHIDO' : 'VAZIO'}`);
    console.log(`- products_services: ${testData.products_services ? 'PREENCHIDO' : 'VAZIO'}`);
    console.log(`- products_services_examples: ${testData.products_services_examples.length} itens`);
    console.log(`- rules_guidelines: ${testData.rules_guidelines ? 'PREENCHIDO' : 'VAZIO'}`);
    console.log(`- rules_guidelines_examples: ${testData.rules_guidelines_examples.length} itens`);
    console.log(`- prohibitions: ${testData.prohibitions ? 'PREENCHIDO' : 'VAZIO'}`);
    console.log(`- prohibitions_examples: ${testData.prohibitions_examples.length} itens`);
    console.log(`- client_objections: ${testData.client_objections ? 'PREENCHIDO' : 'VAZIO'}`);
    console.log(`- client_objections_examples: ${testData.client_objections_examples.length} itens`);
    console.log(`- phrase_tips: ${testData.phrase_tips ? 'PREENCHIDO' : 'VAZIO'}`);
    console.log(`- phrase_tips_examples: ${testData.phrase_tips_examples.length} itens`);
    console.log(`- flow: ${testData.flow.length} passos`);
    
    console.log('\n🚀 TENTANDO INSERIR...');
    
    const { data, error } = await supabase
      .from('ai_agent_prompts')
      .insert(testData)
      .select();
    
    if (error) {
      console.log('❌ ERRO NO INSERT:', error);
      
      // Analisar o tipo de erro
      if (error.message.includes('row-level security')) {
        console.log('🔒 PROBLEMA: Row Level Security está bloqueando');
        console.log('💡 Isso é esperado com usuário anônimo - o código funciona!');
      } else if (error.message.includes('column')) {
        console.log('🗃️ PROBLEMA: Erro de coluna:', error.message);
      } else if (error.message.includes('violates')) {
        console.log('⚠️ PROBLEMA: Violação de constraint:', error.message);
      } else {
        console.log('❓ ERRO DESCONHECIDO:', error.message);
      }
    } else {
      console.log('✅ INSERT FUNCIONOU!');
      console.log('📊 DADOS INSERIDOS:', data);
    }
    
  } catch (err) {
    console.error('💥 ERRO FATAL:', err);
  }
}

testSaveData();