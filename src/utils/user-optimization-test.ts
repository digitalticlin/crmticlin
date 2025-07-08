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