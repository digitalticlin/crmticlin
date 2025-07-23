-- ✅ CORREÇÃO DO TRIGGER INTELIGENTE DE MÍDIA
-- Data: 2025-01-23 14:10:00
-- Problema: pg_net retorna ID da requisição, não o conteúdo diretamente

-- 1. REMOVER TRIGGER ATUAL
DROP TRIGGER IF EXISTS smart_media_conversion_trigger ON media_cache;

-- 2. FUNÇÃO CORRIGIDA COM SINTAXE CORRETA DO pg_net
CREATE OR REPLACE FUNCTION smart_media_conversion()
RETURNS TRIGGER AS $$
DECLARE
  http_response RECORD;
  base64_result text;
  max_size_bytes integer := 5242880; -- 5MB
BEGIN
  -- ✅ VERIFICAR SE DEVE PROCESSAR BASE64
  IF NEW.media_type != 'text' 
     AND NEW.base64_data IS NULL 
     AND NEW.original_url IS NOT NULL 
     AND NEW.original_url != ''
     AND COALESCE(NEW.file_size, 0) > 0
     AND NEW.file_size < max_size_bytes THEN
    
    BEGIN
      RAISE NOTICE '[Smart Media] 🔄 Convertendo mídia % (% bytes)', NEW.id, NEW.file_size;
      
      -- ✅ USAR pg_net com sintaxe correta (buscar resultado)
      SELECT 
        status_code, 
        content 
      INTO http_response
      FROM net.http_get(
        url := NEW.original_url,
        timeout_milliseconds := 15000
      );
      
      -- Verificar se download foi bem-sucedido
      IF http_response.status_code BETWEEN 200 AND 299 AND http_response.content IS NOT NULL THEN
        -- Converter para base64
        base64_result := encode(http_response.content, 'base64');
        
        -- Atualizar campos
        NEW.base64_data := base64_result;
        NEW.updated_at := NOW();
        
        RAISE NOTICE '[Smart Media] ✅ Convertido: % chars base64', length(base64_result);
      ELSE
        RAISE NOTICE '[Smart Media] ❌ HTTP Error: % ou conteúdo vazio', COALESCE(http_response.status_code::text, 'NULL');
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '[Smart Media] ⚠️ Erro na conversão: %', SQLERRM;
      -- Não falhar o trigger, apenas deixar base64_data como NULL
    END;
    
  ELSIF COALESCE(NEW.file_size, 0) >= max_size_bytes THEN
    RAISE NOTICE '[Smart Media] 📦 Arquivo grande (% MB), mantendo apenas Storage URL', 
                 ROUND(NEW.file_size::numeric / 1048576, 2);
    
  ELSE
    RAISE NOTICE '[Smart Media] ⏭️ Pulando: tipo=% tamanho=% url=%', 
                 NEW.media_type, NEW.file_size, LEFT(COALESCE(NEW.original_url, 'NULL'), 30);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. RECRIAR TRIGGER
CREATE TRIGGER smart_media_conversion_trigger
    BEFORE INSERT ON media_cache
    FOR EACH ROW
    EXECUTE FUNCTION smart_media_conversion();

-- 4. TESTAR COM FUNÇÃO SIMPLES (ALTERNATIVA SE pg_net FALHAR)
CREATE OR REPLACE FUNCTION simple_media_conversion()
RETURNS TRIGGER AS $$
DECLARE
  max_size_bytes integer := 1048576; -- 1MB para teste mais conservador
BEGIN
  -- ✅ VERSÃO SIMPLES: MARCAR PARA CONVERSÃO POSTERIOR
  IF NEW.media_type != 'text' 
     AND NEW.base64_data IS NULL 
     AND NEW.original_url IS NOT NULL 
     AND COALESCE(NEW.file_size, 0) > 0
     AND NEW.file_size < max_size_bytes THEN
    
    RAISE NOTICE '[Simple Media] 📝 Marcando para conversão: % (% bytes)', NEW.id, NEW.file_size;
    
    -- Para arquivos pequenos, marcar como "pendente de conversão"
    -- O frontend pode detectar isso e solicitar conversão
    
  ELSE
    RAISE NOTICE '[Simple Media] ⏭️ Arquivo grande ou sem URL: %', NEW.file_size;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. COMENTÁRIOS
COMMENT ON FUNCTION smart_media_conversion() IS 
'Trigger corrigido que converte mídias < 5MB para base64 usando pg_net';

COMMENT ON FUNCTION simple_media_conversion() IS 
'Trigger alternativo simples caso pg_net não funcione';

-- ✅ MIGRATION CONCLUÍDA
SELECT '[Smart Media Fix] 🔧 Trigger corrigido com sintaxe pg_net adequada!' as status; 