-- ✅ SISTEMA INTELIGENTE DE CONVERSÃO DE MÍDIA
-- Data: 2025-01-23 14:00:00
-- Descrição: Trigger que converte automaticamente apenas arquivos < 5MB para base64

-- 1. REMOVER TRIGGER ANTIGO (se existir)
DROP TRIGGER IF EXISTS media_conversion_trigger ON media_cache;
DROP FUNCTION IF EXISTS trigger_media_conversion();

-- 2. FUNÇÃO INTELIGENTE DE CONVERSÃO
CREATE OR REPLACE FUNCTION smart_media_conversion()
RETURNS TRIGGER AS $$
DECLARE
  media_response RECORD;
  base64_result text;
  max_size_bytes integer := 5242880; -- 5MB
  download_timeout integer := 15; -- 15 segundos
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
      
      -- ✅ DOWNLOAD USANDO EXTENSÃO HTTP (pg_net ou http)
      -- Tentar pg_net primeiro (mais moderno)
      BEGIN
        SELECT status, content INTO media_response
        FROM net.http_get(
          url := NEW.original_url,
          timeout_milliseconds := download_timeout * 1000
        );
        
        -- Verificar se download foi bem-sucedido
        IF media_response.status BETWEEN 200 AND 299 THEN
          -- Converter para base64
          base64_result := encode(media_response.content, 'base64');
          
          -- Atualizar campos
          NEW.base64_data := base64_result;
          NEW.updated_at := NOW();
          
          RAISE NOTICE '[Smart Media] ✅ Convertido: % chars base64', length(base64_result);
        ELSE
          RAISE NOTICE '[Smart Media] ❌ HTTP Error: %', media_response.status;
        END IF;
        
      EXCEPTION WHEN OTHERS THEN
        -- Tentar método alternativo (extensão http)
        BEGIN
          SELECT content INTO media_response.content
          FROM http_get(NEW.original_url);
          
          base64_result := encode(media_response.content, 'base64');
          NEW.base64_data := base64_result;
          NEW.updated_at := NOW();
          
          RAISE NOTICE '[Smart Media] ✅ Convertido (fallback): % chars', length(base64_result);
          
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE '[Smart Media] ⚠️ Falha na conversão para %: %', NEW.id, SQLERRM;
          -- Não falhar o trigger, apenas deixar base64_data como NULL
        END;
      END;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '[Smart Media] ❌ Erro geral na conversão: %', SQLERRM;
      -- Continuar sem base64
    END;
    
  ELSIF COALESCE(NEW.file_size, 0) >= max_size_bytes THEN
    RAISE NOTICE '[Smart Media] 📦 Arquivo grande (% MB), mantendo apenas Storage URL', 
                 ROUND(NEW.file_size::numeric / 1048576, 2);
    -- Para arquivos grandes, deixar base64_data como NULL (usar Storage URL)
    
  ELSIF NEW.media_type = 'text' THEN
    RAISE NOTICE '[Smart Media] 📝 Mensagem de texto, sem mídia para processar';
    
  ELSE
    RAISE NOTICE '[Smart Media] ⏭️ Pulando conversão: sem URL ou tamanho inválido';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CRIAR TRIGGER OTIMIZADO
CREATE TRIGGER smart_media_conversion_trigger
    BEFORE INSERT ON media_cache
    FOR EACH ROW
    EXECUTE FUNCTION smart_media_conversion();

-- 4. COMENTÁRIOS E DOCUMENTAÇÃO
COMMENT ON FUNCTION smart_media_conversion() IS 
'Trigger inteligente que converte mídias < 5MB para base64 automaticamente. 
Arquivos maiores mantêm apenas Storage URL para eficiência.';

COMMENT ON TRIGGER smart_media_conversion_trigger ON media_cache IS 
'Executa conversão automática de mídia para base64 em arquivos pequenos (< 5MB)';

-- 5. VERIFICAÇÃO DE DEPENDÊNCIAS
DO $$
BEGIN
  -- Verificar se extensão pg_net está disponível
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE NOTICE '[Smart Media] ⚠️ Extensão pg_net não encontrada, usando método alternativo';
  ELSE
    RAISE NOTICE '[Smart Media] ✅ Extensão pg_net disponível para downloads';
  END IF;
  
  -- Verificar se extensão http está disponível  
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'http_get') THEN
    RAISE NOTICE '[Smart Media] ⚠️ Função http_get não encontrada';
  ELSE
    RAISE NOTICE '[Smart Media] ✅ Função http_get disponível como fallback';
  END IF;
END $$;

-- 6. ESTATÍSTICAS PARA MONITORAMENTO
CREATE OR REPLACE VIEW media_conversion_stats AS
SELECT 
  media_type,
  COUNT(*) as total_entries,
  COUNT(base64_data) as with_base64,
  COUNT(*) - COUNT(base64_data) as without_base64,
  ROUND(AVG(file_size::numeric) / 1048576, 2) as avg_size_mb,
  ROUND(AVG(LENGTH(base64_data)::numeric), 0) as avg_base64_chars
FROM media_cache 
WHERE media_type != 'text'
GROUP BY media_type
ORDER BY total_entries DESC;

COMMENT ON VIEW media_conversion_stats IS 
'Estatísticas de conversão de mídia para monitoramento do sistema';

-- ✅ MIGRATION CONCLUÍDA
SELECT '[Smart Media] 🚀 Sistema de conversão inteligente implementado com sucesso!' as status; 