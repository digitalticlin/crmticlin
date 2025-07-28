import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ✅ MAPEAMENTO DE MIME TYPES BÁSICOS
const getBasicMimeType = (mediaType: string): string => {
  switch (mediaType?.toLowerCase()) {
    case 'image':
      return 'image/jpeg'; // Fallback para imagens
    case 'video':
      return 'video/mp4';
    case 'audio':
      return 'audio/mp3';
    case 'document':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
};

interface MediaData {
  id: string;
  base64_data?: string;
  original_url?: string;
  cached_url?: string;
  mime_type?: string;
  media_type?: string;
}

interface UseMediaRendererOptions {
  messageId: string;
  mediaUrl?: string;
  mediaCache?: any;
  mediaType: string;
}

export const useMediaRenderer = ({ messageId, mediaUrl, mediaCache, mediaType }: UseMediaRendererOptions) => {
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // ✅ PRIORIDADE 1: URL base64 já disponível
      if (mediaUrl && mediaUrl.startsWith('data:')) {
        console.log('[MediaRenderer] ⚡ Base64 já disponível:', messageId.substring(0, 8));
        setFinalUrl(mediaUrl);
        setIsLoading(false);
        return;
      }

             // ✅ PRIORIDADE 2: Cache da mensagem
       if (mediaCache?.base64_data) {
         const mimeType = getBasicMimeType(mediaCache.media_type || mediaType);
         const dataUrl = `data:${mimeType};base64,${mediaCache.base64_data}`;
         console.log('[MediaRenderer] 💾 Cache da mensagem usado:', messageId.substring(0, 8));
         setFinalUrl(dataUrl);
         setIsLoading(false);
         return;
       }

      // ✅ PRIORIDADE 3: Buscar do banco isoladamente
      console.log('[MediaRenderer] 🔍 Buscando media_cache do banco:', messageId.substring(0, 8));
      
             const { data: mediaCacheData, error: dbError } = await supabase
         .from('media_cache')
         .select('id, base64_data, original_url, cached_url, media_type, file_name')
         .eq('message_id', messageId)
         .maybeSingle();

      if (dbError) {
        console.warn('[MediaRenderer] ⚠️ Erro ao buscar media_cache:', dbError);
        setError('Erro ao carregar mídia');
        setIsLoading(false);
        return;
      }

             if (mediaCacheData?.base64_data) {
         const mimeType = getBasicMimeType(mediaCacheData.media_type || mediaType);
         const dataUrl = `data:${mimeType};base64,${mediaCacheData.base64_data}`;
         console.log('[MediaRenderer] ✅ Media encontrada no banco:', {
           messageId: messageId.substring(0, 8),
           mimeType,
           size: `${(mediaCacheData.base64_data.length / 1024).toFixed(1)}KB`
         });
         setFinalUrl(dataUrl);
         setIsLoading(false);
         return;
       }

      // ✅ FALLBACK: URL original/cached
      const fallbackUrl = mediaCacheData?.cached_url || mediaCacheData?.original_url || mediaUrl;
      if (fallbackUrl && !fallbackUrl.startsWith('data:')) {
        console.log('[MediaRenderer] 🔗 Usando URL fallback:', messageId.substring(0, 8));
        setFinalUrl(fallbackUrl);
        setIsLoading(false);
        return;
      }

      // Sem mídia disponível
      console.log('[MediaRenderer] ❌ Nenhuma mídia encontrada:', messageId.substring(0, 8));
      setError('Mídia não disponível');
      setIsLoading(false);

    } catch (err) {
      console.error('[MediaRenderer] ❌ Erro geral:', err);
      setError('Erro ao carregar mídia');
      setIsLoading(false);
    }
  }, [messageId, mediaUrl, mediaCache]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  return {
    finalUrl,
    isLoading,
    error,
    retry: loadMedia
  };
}; 