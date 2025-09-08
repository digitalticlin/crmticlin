-- 🔧 FIX: Erro da tabela _supabase_migrations que não existe
-- Executar apenas esta parte que deu erro

-- Ignorar o erro da tabela de migrations - ela não existe mesmo
-- A parte importante (desativar RLS + criar policies) já funcionou

-- Apenas executar o teste para verificar se está funcionando
SELECT * FROM test_rls_disabled();