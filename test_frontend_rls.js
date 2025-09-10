// 🧪 TESTE RLS VIA FRONTEND (Cole no console do navegador após fazer login)

// 1. Testar se auth funciona
console.log('=== TESTE AUTH CONTEXT ===');
console.log('User ID:', supabase.auth.getUser());

// 2. Testar query de leads (deve retornar apenas do usuário)
async function testRLS() {
  console.log('=== TESTANDO RLS ===');
  
  // Buscar perfil do usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .limit(1);
  
  console.log('Perfil encontrado:', profile);
  console.log('Erro de perfil:', profileError);
  
  // Buscar leads (RLS deve filtrar automaticamente)
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('id, created_by_user_id')
    .limit(5);
    
  console.log('Leads encontrados:', leads?.length || 0);
  console.log('Primeiros 5 leads:', leads);
  console.log('Erro de leads:', leadsError);
  
  // Testar função de diagnóstico
  const { data: diagnostic, error: diagError } = await supabase
    .rpc('test_auth_context_detailed');
    
  console.log('Diagnóstico:', diagnostic);
  console.log('Erro de diagnóstico:', diagError);
}

// Executar teste
testRLS();