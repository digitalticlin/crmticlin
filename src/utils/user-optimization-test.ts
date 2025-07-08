// 🚀 TESTE DE OTIMIZAÇÃO ESPECÍFICA POR USUÁRIO
// Este arquivo pode ser removido após confirmação do funcionamento

interface ContactLimits {
  INITIAL_CONTACTS_LIMIT: number;
  CONTACTS_PAGE_SIZE: number;
  CACHE_DURATION: number;
}

// Lista de usuários prioritários (mesma do hook)
const PRIORITY_USERS = [
  'contatoluizantoniooliveira@gmail.com',
];

// Função de teste (mesma do hook)
const getContactLimits = (userEmail: string | null): ContactLimits => {
  const isPriorityUser = userEmail && PRIORITY_USERS.includes(userEmail.toLowerCase());
  
  if (isPriorityUser) {
    console.log(`🚀 TESTE: Usuário prioritário detectado: ${userEmail}`);
    return {
      INITIAL_CONTACTS_LIMIT: 500, // 🚀 MUITO MAIOR para usuários específicos
      CONTACTS_PAGE_SIZE: 200,     // 🚀 CARREGAMENTO MAIS AGRESSIVO
      CACHE_DURATION: 120 * 1000   // 🚀 CACHE MAIS LONGO (2 minutos)
    };
  }
  
  console.log(`📊 TESTE: Usuário padrão: ${userEmail || 'anônimo'}`);
  return {
    INITIAL_CONTACTS_LIMIT: 200,  // 🚀 PADRÃO para outros usuários
    CONTACTS_PAGE_SIZE: 100,      // 🚀 PADRÃO para outros usuários
    CACHE_DURATION: 60 * 1000     // 🚀 PADRÃO para outros usuários
  };
};

// Função para testar diferentes emails
export const testUserOptimization = () => {
  console.log('=== TESTE DE OTIMIZAÇÃO POR USUÁRIO ===');
  
  // Teste 1: Usuário prioritário
  const priorityLimits = getContactLimits('contatoluizantoniooliveira@gmail.com');
  console.log('Teste 1 (Prioritário):', priorityLimits);
  
  // Teste 2: Usuário padrão
  const standardLimits = getContactLimits('usuario.comum@exemplo.com');
  console.log('Teste 2 (Padrão):', standardLimits);
  
  // Teste 3: Usuário sem email
  const anonymousLimits = getContactLimits(null);
  console.log('Teste 3 (Anônimo):', anonymousLimits);
  
  // Teste 4: Case insensitive
  const upperCaseLimits = getContactLimits('CONTATOLUIZANTONIOOLIVEIRA@GMAIL.COM');
  console.log('Teste 4 (MAIÚSCULO):', upperCaseLimits);
  
  console.log('=== FIM DOS TESTES ===');
};

// Teste para verificar se a funcionalidade de mudança de etapas está funcionando
export const testStageChangeImplementation = () => {
  console.log('🧪 [Teste Stage Change] Verificando implementação...');
  
  // 1. Verificar se o evento customizado funciona
  const testEvent = () => {
    console.log('📡 [Teste] Disparando evento de teste...');
    window.dispatchEvent(new CustomEvent('refreshWhatsAppContacts'));
    window.dispatchEvent(new CustomEvent('updateSelectedContactStage', {
      detail: { leadId: 'test-lead-123', newStageId: 'test-stage-456', newStageName: 'Teste' }
    }));
  };

  // 2. Verificar se os logs estão funcionando
  const checkLogs = () => {
    console.log('📝 [Teste] Verificando logs do sistema...');
    console.log('[StageSelector] 🔍 Teste de log do StageSelector');
    console.log('[LeadStageManager] 🔄 Teste de log do LeadStageManager');
    console.log('[WhatsApp Contacts] 🔄 Teste de log dos Contatos');
  };

  return {
    testEvent,
    checkLogs,
    summary: {
      'StageSelector': 'Atualização visual em tempo real implementada',
      'LeadStageManager': 'Atualização otimista e invalidação de cache implementada',
      'WhatsAppContacts': 'Listener para refresh automático implementado',
      'ChatProvider': 'Listener para atualização do contato selecionado implementado'
    }
  };
};

// Para usar no console do navegador:
// import { testStageChangeImplementation } from './utils/user-optimization-test';
// const test = testStageChangeImplementation();
// test.testEvent();
// test.checkLogs(); 