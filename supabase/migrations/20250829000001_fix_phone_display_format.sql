-- 📱 CORREÇÃO: PADRONIZAR FORMATO DE EXIBIÇÃO DE TELEFONE
-- Alterar de "+55 (62) 9921-2484" para "+55 (62) 9999-9999" (4 dígitos após hífen)

-- 1. 🔧 ATUALIZAR FUNÇÃO format_brazilian_phone
CREATE OR REPLACE FUNCTION format_brazilian_phone(input_phone text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  clean_phone text;
  formatted_display text;
  area_code text;
  number_part text;
BEGIN
  -- Limpar apenas números
  clean_phone := regexp_replace(input_phone, '[^0-9]', '', 'g');
  
  -- Se começar com 55 (código do Brasil), manter
  IF clean_phone ~ '^55' THEN
    clean_phone := clean_phone;
  ELSIF length(clean_phone) >= 10 THEN
    -- Se não tem 55, adicionar
    clean_phone := '55' || clean_phone;
  ELSE
    -- Número muito curto, retornar original
    RETURN jsonb_build_object(
      'phone', input_phone,
      'display', input_phone
    );
  END IF;
  
  -- Validar comprimento (deve ter 13 ou 12 dígitos: 55 + DDD + número)
  IF length(clean_phone) = 13 THEN
    -- Formato celular moderno: 5562999999999 -> phone: '5562999999999', display: '+55 (62) 99999-9999'
    area_code := substring(clean_phone, 3, 2);  -- DDD
    number_part := substring(clean_phone, 5);   -- Número completo (9 dígitos)
    
    -- 🔧 CELULAR 9 DÍGITOS: +55 (62) 99999-9999 (5 dígitos + hífen + 4 dígitos)
    formatted_display := '+55 (' || area_code || ') ' || 
                        substring(number_part, 1, 5) || '-' ||  -- Primeiros 5 dígitos
                        substring(number_part, 6);              -- Últimos 4 dígitos
                        
  ELSIF length(clean_phone) = 12 THEN
    -- Formato fixo/celular antigo: 556299999999 -> phone: '556299999999', display: '+55 (62) 9999-9999'
    area_code := substring(clean_phone, 3, 2);
    number_part := substring(clean_phone, 5);   -- Número completo (8 dígitos)
    
    -- 🔧 FIXO/ANTIGO 8 DÍGITOS: +55 (62) 9999-9999 (4 dígitos + hífen + 4 dígitos)
    formatted_display := '+55 (' || area_code || ') ' || 
                        substring(number_part, 1, 4) || '-' ||  -- Primeiros 4 dígitos
                        substring(number_part, 5);              -- Últimos 4 dígitos
  ELSE
    -- Comprimento inválido, retornar original
    RETURN jsonb_build_object(
      'phone', input_phone,
      'display', input_phone
    );
  END IF;
  
  RETURN jsonb_build_object(
    'phone', clean_phone,           -- Para busca: "556299212484"
    'display', formatted_display    -- Para exibição: "+55 (62) 99999-9999"
  );
END;
$$;

-- 2. 🧪 TESTE DA NOVA FORMATAÇÃO
DO $$
DECLARE
  result jsonb;
BEGIN
  -- Testar celular moderno com 9 dígitos (13 total)
  result := format_brazilian_phone('5562999999999');
  RAISE NOTICE '📱 Teste Celular 9 dígitos: % -> %', '5562999999999', result->>'display';
  
  -- Testar fixo/celular antigo com 8 dígitos (12 total)
  result := format_brazilian_phone('556299999999');
  RAISE NOTICE '📱 Teste Fixo 8 dígitos: % -> %', '556299999999', result->>'display';
  
  -- Testar número sem código do país
  result := format_brazilian_phone('62999999999');
  RAISE NOTICE '📱 Teste Sem 55 (celular): % -> %', '62999999999', result->>'display';
END $$;

-- 3. ✅ VERIFICAR PERMISSÕES
GRANT EXECUTE ON FUNCTION format_brazilian_phone(text) TO service_role;

-- 4. ✅ LOG DE SUCESSO
DO $$
BEGIN
  RAISE NOTICE '✅ FORMATAÇÃO DE TELEFONE ATUALIZADA!';
  RAISE NOTICE '📱 Novo formato padrão:';
  RAISE NOTICE '   Celular: "+55 (62) 99999-9999" (5+4 dígitos)';
  RAISE NOTICE '   Fixo:    "+55 (62) 9999-9999" (4+4 dígitos)';
  RAISE NOTICE '🎯 Padronizado para 4 dígitos após o hífen como solicitado!';
END $$;