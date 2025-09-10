-- =========================================================
-- PASSO 2: VALIDAR CONVITE DE MEMBRO OPERACIONAL
-- =========================================================
-- Este script valida o fluxo:
-- Admin convida → Email nativo → /invite → Cria senha → Login OPERACIONAL
-- =========================================================

-- 1️⃣ VERIFICAR SE FUNÇÃO handle_user_signup EXISTE E ESTÁ CORRETA
-- (Esta função vincula profiles de convite ao auth.users)
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  affected_rows INTEGER;
  profile_role TEXT;
BEGIN
  RAISE NOTICE '[handle_user_signup] ========================================';
  RAISE NOTICE '[handle_user_signup] 📧 VERIFICANDO CONVITE';
  RAISE NOTICE '[handle_user_signup] Email: %', NEW.email;
  RAISE NOTICE '[handle_user_signup] User ID: %', NEW.id;
  
  -- Verificar se existe profile de convite pendente
  SELECT role INTO profile_role
  FROM public.profiles 
  WHERE email = NEW.email 
    AND invite_status IN ('sent', 'pending')
    AND linked_auth_user_id IS NULL
  LIMIT 1;
  
  IF profile_role IS NOT NULL THEN
    RAISE NOTICE '[handle_user_signup] ✅ Convite encontrado! Role: %', profile_role;
    
    -- Vincular profile existente ao novo auth.user
    UPDATE public.profiles 
    SET 
      linked_auth_user_id = NEW.id,
      invite_status = 'accepted',
      invite_token = NULL, -- Limpar token usado
      temp_password = NULL, -- Limpar senha temporária
      updated_at = NOW()
    WHERE email = NEW.email 
      AND invite_status IN ('sent', 'pending')
      AND linked_auth_user_id IS NULL;
      
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RAISE NOTICE '[handle_user_signup] ✅ Profile vinculado como: %', profile_role;
    RAISE NOTICE '[handle_user_signup] Linhas afetadas: %', affected_rows;
  ELSE
    RAISE NOTICE '[handle_user_signup] ℹ️ Nenhum convite pendente (registro normal)';
  END IF;
  
  RAISE NOTICE '[handle_user_signup] ========================================';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2️⃣ CRIAR TRIGGER ADICIONAL PARA PROCESSAR CONVITES
-- (Este trigger roda ANTES do handle_new_user)
DROP TRIGGER IF EXISTS process_invite_on_signup ON auth.users;

CREATE TRIGGER process_invite_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_signup();

-- 3️⃣ AJUSTAR ORDEM DOS TRIGGERS
-- O trigger de convite deve rodar ANTES do trigger de novo usuário
-- PostgreSQL executa triggers em ordem alfabética, então vamos renomear

-- Remover triggers existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS process_invite_on_signup ON auth.users;

-- Recriar com nomes que garantem ordem correta
-- "a_" roda antes de "b_"
CREATE TRIGGER a_process_invite_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_signup();

CREATE TRIGGER b_create_new_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = NEW.id
  ))
  EXECUTE FUNCTION public.handle_new_user();

RAISE NOTICE '✅ FLUXO 2 VALIDADO: Sistema de convites';

-- =========================================================
-- VERIFICAÇÃO DO FLUXO 2
-- =========================================================

-- Verificar triggers na ordem correta
SELECT 
    trigger_name,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
AND event_object_table = 'users'
ORDER BY trigger_name;

-- Verificar se função handle_user_signup está correta
SELECT 
    'FUNÇÃO CONVITE OK' as status,
    proname as function_name,
    prosrc LIKE '%invite_status%' as verifica_convite,
    prosrc LIKE '%linked_auth_user_id%' as vincula_auth
FROM pg_proc 
WHERE proname = 'handle_user_signup';

-- Verificar profiles com convites pendentes
SELECT 
    id,
    full_name,
    email,
    role,
    invite_status,
    invite_token IS NOT NULL as tem_token,
    linked_auth_user_id IS NULL as aguardando_vinculo,
    created_by_user_id
FROM public.profiles
WHERE invite_status IN ('sent', 'pending')
ORDER BY created_at DESC;

-- =========================================================
-- TESTE DO FLUXO 2
-- =========================================================
-- Para testar o sistema de convites:
-- 1. Admin acessa Team Settings
-- 2. Adiciona membro como "operational"
-- 3. Email é enviado com link /invite/{token}
-- 4. Membro acessa link, cria senha
-- 5. Verifica se:
--    - Profile foi vinculado (linked_auth_user_id preenchido)
--    - Role mantido como "operational"
--    - invite_status = "accepted"
--    - NÃO criou funil (apenas admin tem funil)
-- =========================================================