-- Tentar executar a função manualmente para ver o erro

DO $$
DECLARE
  v_user RECORD;
BEGIN
  -- Buscar o usuário que não teve profile criado
  SELECT * INTO v_user
  FROM auth.users
  WHERE id = '76f094e2-c33b-4110-b991-1cc48c53b576';

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado!';
  END IF;

  RAISE NOTICE 'Tentando executar handle_new_user para: %', v_user.email;
  RAISE NOTICE 'Metadata: %', v_user.raw_user_meta_data;

  -- Simular o trigger manualmente
  PERFORM public.handle_new_user();

  RAISE NOTICE 'Função executada sem erros';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO CAPTURADO:';
    RAISE NOTICE '  SQLSTATE: %', SQLSTATE;
    RAISE NOTICE '  SQLERRM: %', SQLERRM;
END $$;