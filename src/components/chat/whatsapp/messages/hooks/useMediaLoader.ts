
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
      console.log(`[MediaLoader] 🔍 Carregando mídia para ${messageId} (${mediaType})`);
      setIsLoading(true);
      setError(null);

      try {
        // PRIORIDADE 1: Cache local válido
        const cachedUrl = getCachedUrl(messageId);
        if (cachedUrl) {
          console.log(`[MediaLoader] 💾 Usando cache local para ${messageId}`);
          setFinalUrl(cachedUrl);
          setIsLoading(false);
          return;
        }

        // PRIORIDADE 2: Buscar dados base64 do banco (SEMPRE FUNCIONA)
        console.log(`[MediaLoader] 📦 Buscando cache do banco para ${messageId}`);
        const { data: cacheData, error: cacheError } = await supabase
          .from('media_cache')
          .select('base64_data, cached_url, file_name')
          .eq('message_id', messageId)
          .maybeSingle();

        if (cacheError) {
          console.warn(`[MediaLoader] ⚠️ Erro ao buscar cache: ${cacheError.message}`);
        }

        // PRIORIDADE 2A: Base64 do cache (melhor opção - sempre funciona)
        if (cacheData?.base64_data) {
          try {
            const mimeType = getMimeType(mediaType);
            const dataUrl = `data:${mimeType};base64,${cacheData.base64_data}`;
            console.log(`[MediaLoader] ✅ Usando base64 para ${messageId}`);
            setFinalUrl(dataUrl);
            setCachedUrl(messageId, dataUrl);
            setIsLoading(false);
            return;
          } catch (base64Error) {
            console.warn(`[MediaLoader] ⚠️ Erro ao processar base64: ${base64Error}`);
          }
        }

        // PRIORIDADE 2B: URL cached do Supabase Storage (se válida)
        if (cacheData?.cached_url) {
          try {
            // Verificar se URL é do Supabase Storage e ainda é válida
            if (cacheData.cached_url.includes('supabase.co/storage/v1/object/public/whatsapp-media/')) {
              const response = await fetch(cacheData.cached_url, { method: 'HEAD' });
              if (response.ok) {
                console.log(`[MediaLoader] ✅ Usando cached URL válida para ${messageId}`);
                setFinalUrl(cacheData.cached_url);
                setCachedUrl(messageId, cacheData.cached_url);
                setIsLoading(false);
                return;
              } else {
                console.warn(`[MediaLoader] ⚠️ Cached URL inválida (${response.status})`);
              }
            }
          } catch (urlError) {
            console.warn(`[MediaLoader] ⚠️ Erro ao validar cached URL: ${urlError}`);
          }
        }

        // PRIORIDADE 3: Tentar construir URL do Storage baseada no messageId
        try {
          const fileExtension = getFileExtension(mediaType);
          const fileName = `${messageId}.${fileExtension}`;
          
          const { data: storageData } = supabase.storage
            .from('whatsapp-media')
            .getPublicUrl(fileName);
          
          if (storageData?.publicUrl) {
            // Verificar se arquivo existe no storage
            const response = await fetch(storageData.publicUrl, { method: 'HEAD' });
            if (response.ok) {
              console.log(`[MediaLoader] ✅ Arquivo encontrado no Storage: ${messageId}`);
              setFinalUrl(storageData.publicUrl);
              setCachedUrl(messageId, storageData.publicUrl);
              setIsLoading(false);
              return;
            } else {
              console.warn(`[MediaLoader] ⚠️ Arquivo não encontrado no Storage (${response.status})`);
            }
          }
        } catch (storageError) {
          console.warn(`[MediaLoader] ⚠️ Erro ao acessar Storage: ${storageError}`);
        }

        // PRIORIDADE 4: Se mediaUrl não é do WhatsApp, tentar como última opção
        if (mediaUrl && !isWhatsAppUrl(mediaUrl)) {
          try {
            const response = await fetch(mediaUrl, { method: 'HEAD' });
            if (response.ok) {
              console.log(`[MediaLoader] 🔄 Usando URL externa como fallback: ${messageId}`);
              setFinalUrl(mediaUrl);
              setCachedUrl(messageId, mediaUrl);
              setIsLoading(false);
              return;
            }
          } catch (originalUrlError) {
            console.warn(`[MediaLoader] ⚠️ URL externa inválida: ${originalUrlError}`);
          }
        }

        // PRIORIDADE 5: Nenhuma fonte válida encontrada
        console.error(`[MediaLoader] ❌ Nenhuma fonte válida encontrada para ${messageId}`);
        setError('Mídia não disponível');
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

// Funções auxiliares
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

const isWhatsAppUrl = (url: string): boolean => {
  return url.includes('mmg.whatsapp.net') || url.includes('pps.whatsapp.net');
};
