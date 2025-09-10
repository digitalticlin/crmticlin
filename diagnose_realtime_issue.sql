-- Diagnóstico e Correção do Problema de Realtime WhatsApp
-- Execute este script no Supabase SQL Editor

DO $$
BEGIN
  RAISE NOTICE '=== DIAGNÓSTICO DO PROBLEMA DE REALTIME ===';
END $$;

-- 1. Verificar políticas RLS atuais
DO $$
DECLARE
  policy_record record;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '1. POLÍTICAS RLS NA TABELA MESSAGES:';
  
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
    FROM pg_policies 
    WHERE tablename = 'messages'
  LOOP
    RAISE NOTICE 'Política: % | Comando: % | Condição: %', 
      policy_record.policyname, 
      policy_record.cmd, 
      policy_record.qual;
  END LOOP;
END $$;

-- 2. Verificar se função user_has_whatsapp_number existe
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '2. VERIFICANDO FUNÇÃO user_has_whatsapp_number:';
  
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'user_has_whatsapp_number'
  ) THEN
    RAISE NOTICE 'Função user_has_whatsapp_number EXISTE';
  ELSE
    RAISE NOTICE 'Função user_has_whatsapp_number NÃO EXISTE - PROBLEMA IDENTIFICADO!';
  END IF;
END $$;

-- 3. Verificar configuração de replica identity
DO $$
DECLARE
  rep_identity char;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '3. CONFIGURAÇÃO DE REPLICA IDENTITY:';
  
  SELECT relreplident INTO rep_identity
  FROM pg_class 
  WHERE relname = 'messages' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  
  CASE rep_identity
    WHEN 'd' THEN RAISE NOTICE 'messages: default (apenas chave primária)';
    WHEN 'n' THEN RAISE NOTICE 'messages: nothing';
    WHEN 'f' THEN RAISE NOTICE 'messages: full (todas as colunas) ✓';
    WHEN 'i' THEN RAISE NOTICE 'messages: using index';
    ELSE RAISE NOTICE 'messages: valor desconhecido: %', rep_identity;
  END CASE;

  SELECT relreplident INTO rep_identity
  FROM pg_class 
  WHERE relname = 'leads' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  
  CASE rep_identity
    WHEN 'd' THEN RAISE NOTICE 'leads: default (apenas chave primária)';
    WHEN 'n' THEN RAISE NOTICE 'leads: nothing';
    WHEN 'f' THEN RAISE NOTICE 'leads: full (todas as colunas) ✓';
    WHEN 'i' THEN RAISE NOTICE 'leads: using index';
    ELSE RAISE NOTICE 'leads: valor desconhecido: %', rep_identity;
  END CASE;
END $$;

-- 4. Verificar configuração realtime
DO $$
DECLARE
  pub_record record;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '4. PUBLICAÇÕES REALTIME:';
  
  FOR pub_record IN 
    SELECT schemaname, tablename, pubname
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime'
  LOOP
    RAISE NOTICE 'Tabela publicada: %.%', pub_record.schemaname, pub_record.tablename;
  END LOOP;
END $$;

-- === INÍCIO DAS CORREÇÕES ===

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== INICIANDO CORREÇÕES ===';
END $$;

-- 5. Criar função user_has_whatsapp_number se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'user_has_whatsapp_number'
  ) THEN
    RAISE NOTICE '5. Criando função user_has_whatsapp_number...';
    
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.user_has_whatsapp_number(number_id UUID)
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $func$
    BEGIN
      RETURN EXISTS (
        SELECT 1 
        FROM whatsapp_numbers wn
        JOIN whatsapp_instances wi ON wn.instance_id = wi.id
        WHERE wn.id = number_id 
        AND wi.created_by_user_id = auth.uid()
      );
    END;
    $func$';
    
    RAISE NOTICE 'Função user_has_whatsapp_number criada com sucesso!';
  ELSE
    RAISE NOTICE '5. Função user_has_whatsapp_number já existe';
  END IF;
END $$;

-- 6. Remover políticas RLS conflitantes
DO $$
BEGIN
  RAISE NOTICE '6. Removendo políticas RLS conflitantes...';
  
  -- Remover políticas existentes
  DROP POLICY IF EXISTS "Users can view messages from their WhatsApp numbers" ON messages;
  DROP POLICY IF EXISTS "Users can insert messages to their WhatsApp numbers" ON messages;
  DROP POLICY IF EXISTS "Users can update messages from their WhatsApp numbers" ON messages;
  DROP POLICY IF EXISTS "Users can delete messages from their WhatsApp numbers" ON messages;
  DROP POLICY IF EXISTS "messages_select_policy" ON messages;
  DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
  DROP POLICY IF EXISTS "messages_update_policy" ON messages;
  DROP POLICY IF EXISTS "messages_delete_policy" ON messages;
  
  RAISE NOTICE 'Políticas antigas removidas';
END $$;

-- 7. Criar políticas RLS simplificadas
DO $$
BEGIN
  RAISE NOTICE '7. Criando políticas RLS simplificadas...';
  
  -- Habilitar RLS se não estiver habilitado
  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
  
  -- Políticas baseadas em created_by_user_id
  CREATE POLICY "messages_select_policy" ON messages
    FOR SELECT TO authenticated
    USING (created_by_user_id = auth.uid());
    
  CREATE POLICY "messages_insert_policy" ON messages
    FOR INSERT TO authenticated
    WITH CHECK (created_by_user_id = auth.uid());
    
  CREATE POLICY "messages_update_policy" ON messages
    FOR UPDATE TO authenticated
    USING (created_by_user_id = auth.uid())
    WITH CHECK (created_by_user_id = auth.uid());
    
  CREATE POLICY "messages_delete_policy" ON messages
    FOR DELETE TO authenticated
    USING (created_by_user_id = auth.uid());
  
  RAISE NOTICE 'Políticas RLS criadas com sucesso!';
END $$;

-- 8. Garantir configuração realtime
DO $$
BEGIN
  RAISE NOTICE '8. Configurando realtime...';
  
  -- Configurar replica identity como FULL se não estiver
  ALTER TABLE messages REPLICA IDENTITY FULL;
  ALTER TABLE leads REPLICA IDENTITY FULL;
  
  RAISE NOTICE 'Replica identity configurado como FULL';
END $$;

-- 9. Adicionar tabelas à publicação realtime
DO $$
BEGIN
  RAISE NOTICE '9. Adicionando tabelas à publicação realtime...';
  
  -- Verificar se as tabelas já estão na publicação
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    RAISE NOTICE 'Tabela messages adicionada à publicação realtime';
  ELSE
    RAISE NOTICE 'Tabela messages já está na publicação realtime';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leads;
    RAISE NOTICE 'Tabela leads adicionada à publicação realtime';
  ELSE
    RAISE NOTICE 'Tabela leads já está na publicação realtime';
  END IF;
END $$;

-- === VERIFICAÇÃO FINAL ===

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICAÇÃO FINAL ===';
END $$;

-- 10. Verificar políticas finais
DO $$
DECLARE
  policy_count int;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'messages';
  
  RAISE NOTICE 'Total de políticas RLS na tabela messages: %', policy_count;
  
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'user_has_whatsapp_number'
  ) THEN
    RAISE NOTICE 'Função user_has_whatsapp_number: ✓ EXISTE';
  ELSE
    RAISE NOTICE 'Função user_has_whatsapp_number: ✗ NÃO EXISTE';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== CORREÇÕES CONCLUÍDAS ===';
  RAISE NOTICE 'Execute este script e depois teste o realtime no frontend';
  RAISE NOTICE 'Monitore os componentes de debug em Admin → Sistema';
END $$; 