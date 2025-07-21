
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseMediaLoaderProps {
  messageId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
}

interface UseMediaLoaderReturn {
  finalUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

// Cache no localStorage para URLs válidas
const CACHE_KEY = 'media_cache_urls';
const getCachedUrl = (messageId: string): string | null => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const cached = cache[messageId];
    if (cached && cached.expires > Date.now()) {
      return cached.url;
    }
    return null;
  } catch {
    return null;
  }
};

const setCachedUrl = (messageId: string, url: string) => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[messageId] = {
      url,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Falha silenciosa no cache
  }
};

export const useMediaLoader = ({ 
  messageId, 
  mediaType, 
  mediaUrl 
}: UseMediaLoaderProps): UseMediaLoaderReturn => {
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMedia = async () => {
      console.log(`[MediaLoader] 🔍 Carregando mídia OTIMIZADA para ${messageId} (${mediaType})`);
      setIsLoading(true);
      setError(null);

      try {
        // PRIORIDADE 1: Cache local válido
        const cachedUrl = getCachedUrl(messageId);
        if (cachedUrl) {
          console.log(`[MediaLoader] 💾 Cache local encontrado para ${messageId}`);
          setFinalUrl(cachedUrl);
          setIsLoading(false);
          return;
        }

        // PRIORIDADE 2: Base64 do media_cache (MAIS ALTA PRIORIDADE)
        console.log(`[MediaLoader] 📦 Buscando Base64 do banco para ${messageId}`);
        const { data: cacheData, error: cacheError } = await supabase
          .from('media_cache')
          .select('base64_data, cached_url, file_name, media_type')
          .eq('message_id', messageId)
          .single();

        if (cacheError && cacheError.code !== 'PGRST116') {
          console.warn(`[MediaLoader] ⚠️ Erro ao buscar cache: ${cacheError.message}`);
        }

        // PRIORIDADE 2A: Base64 disponível (SEMPRE FUNCIONA)
        if (cacheData?.base64_data) {
          try {
            const mimeType = getMimeType(mediaType);
            const dataUrl = `data:${mimeType};base64,${cacheData.base64_data}`;
            console.log(`[MediaLoader] ✅ Base64 encontrado para ${messageId} (${(cacheData.base64_data.length / 1024).toFixed(1)}KB)`);
            setFinalUrl(dataUrl);
            setCachedUrl(messageId, dataUrl);
            setIsLoading(false);
            return;
          } catch (base64Error) {
            console.warn(`[MediaLoader] ⚠️ Erro ao processar Base64: ${base64Error}`);
          }
        }

        // PRIORIDADE 2B: URL cached do Supabase Storage válida
        if (cacheData?.cached_url && cacheData.cached_url.includes('supabase.co/storage')) {
          try {
            const response = await fetch(cacheData.cached_url, { method: 'HEAD' });
            if (response.ok) {
              console.log(`[MediaLoader] ✅ URL do Storage válida para ${messageId}`);
              setFinalUrl(cacheData.cached_url);
              setCachedUrl(messageId, cacheData.cached_url);
              setIsLoading(false);
              return;
            } else {
              console.warn(`[MediaLoader] ⚠️ URL do Storage inválida (${response.status})`);
            }
          } catch (urlError) {
            console.warn(`[MediaLoader] ⚠️ Erro ao validar URL do Storage: ${urlError}`);
          }
        }

        // PRIORIDADE 3: Tentar construir URL do Storage
        try {
          const fileExtension = getFileExtension(mediaType);
          const fileName = `${messageId}.${fileExtension}`;
          
          const { data: storageData } = supabase.storage
            .from('whatsapp-media')
            .getPublicUrl(fileName);
          
          if (storageData?.publicUrl) {
            const response = await fetch(storageData.publicUrl, { method: 'HEAD' });
            if (response.ok) {
              console.log(`[MediaLoader] ✅ Arquivo encontrado no Storage: ${messageId}`);
              setFinalUrl(storageData.publicUrl);
              setCachedUrl(messageId, storageData.publicUrl);
              setIsLoading(false);
              return;
            }
          }
        } catch (storageError) {
          console.warn(`[MediaLoader] ⚠️ Erro ao acessar Storage: ${storageError}`);
        }

        // PRIORIDADE 4: Se mídia não foi encontrada em lugar nenhum
        console.warn(`[MediaLoader] ❌ Nenhuma fonte de mídia válida encontrada para ${messageId}`);
        
        // Verificar se há registro de mídia indisponível
        if (cacheData && !cacheData.base64_data && !cacheData.cached_url) {
          setError('Mídia expirada');
        } else {
          setError('Mídia não encontrada');
        }
        setFinalUrl(null);

      } catch (err) {
        console.error(`[MediaLoader] ❌ Erro geral no carregamento:`, err);
        setError('Erro ao carregar mídia');
        setFinalUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadMedia();
  }, [messageId, mediaUrl, mediaType]);

  return { finalUrl, isLoading, error };
};

// Funções auxiliares otimizadas
const getMimeType = (type: string): string => {
  switch (type) {
    case 'image': return 'image/jpeg';
    case 'video': return 'video/mp4';
    case 'audio': return 'audio/ogg';
    case 'document': return 'application/pdf';
    default: return 'application/octet-stream';
  }
};

const getFileExtension = (type: string): string => {
  switch (type) {
    case 'image': return 'jpg';
    case 'video': return 'mp4';
    case 'audio': return 'ogg';
    case 'document': return 'pdf';
    default: return 'bin';
  }
};
