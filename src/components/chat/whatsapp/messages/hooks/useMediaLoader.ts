
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
  // 🆕 NOVAS PROPRIEDADES PARA FALLBACK
  shouldShowDownloadButton: boolean;
  originalUrl: string | null;
  isLargeMedia: boolean;
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

// Verificar se URL está acessível
const checkUrlAccess = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// 🆕 FUNÇÃO PARA DETECTAR SE MÍDIA É GRANDE
const isLargeMediaType = (mediaType: string, fileSize?: number): boolean => {
  if (fileSize) {
    // Se arquivo é maior que 5MB, consideramos grande
    return fileSize > 5 * 1024 * 1024;
  }
  
  // Fallback baseado no tipo
  return mediaType === 'video' || mediaType === 'document';
};

export const useMediaLoader = ({ 
  messageId, 
  mediaType, 
  mediaUrl 
}: UseMediaLoaderProps): UseMediaLoaderReturn => {
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 🆕 NOVOS ESTADOS
  const [shouldShowDownloadButton, setShouldShowDownloadButton] = useState(false);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [isLargeMedia, setIsLargeMedia] = useState(false);

  useEffect(() => {
    const loadMedia = async () => {
      console.log(`[MediaLoader] 🔍 Carregando mídia para ${messageId} (${mediaType})`);
      setIsLoading(true);
      setError(null);
      setShouldShowDownloadButton(false);
      setOriginalUrl(mediaUrl || null);

      try {
        // PRIORIDADE 1: Cache local válido
        const cachedUrl = getCachedUrl(messageId);
        if (cachedUrl) {
          console.log(`[MediaLoader] 💾 Cache local encontrado para ${messageId}`);
          setFinalUrl(cachedUrl);
          setIsLoading(false);
          return;
        }

        // PRIORIDADE 2: SEMPRE buscar por original_url PRIMEIRO (edge function salva assim)
        let cacheData = null;
        
        if (mediaUrl) {
          console.log(`[MediaLoader] 🎯 Buscando Base64 por original_url (PRIORIDADE): ${mediaUrl.substring(0, 80)}...`);
          
          const { data: cacheByUrl, error: cacheByUrlError } = await supabase
            .from('media_cache')
            .select('base64_data, cached_url, file_name, media_type, original_url, message_id, file_size')
            .eq('original_url', mediaUrl)
            .single();

          if (cacheByUrlError && cacheByUrlError.code !== 'PGRST116') {
            console.warn(`[MediaLoader] ⚠️ Erro ao buscar cache por URL: ${cacheByUrlError.message}`);
          } else if (cacheByUrl) {
            console.log(`[MediaLoader] ✅ Cache encontrado por URL para ${messageId}`);
            cacheData = cacheByUrl;
          }
        }

        // PRIORIDADE 3: Fallback para message_id apenas se não encontrou por URL
        if (!cacheData) {
          console.log(`[MediaLoader] 🔄 Fallback: Buscando por message_id: ${messageId}`);
          
          const { data: cacheById, error: cacheByIdError } = await supabase
          .from('media_cache')
            .select('base64_data, cached_url, file_name, media_type, original_url, message_id, file_size')
          .eq('message_id', messageId)
          .single();

          if (cacheByIdError && cacheByIdError.code !== 'PGRST116') {
            console.warn(`[MediaLoader] ⚠️ Erro ao buscar cache por message_id: ${cacheByIdError.message}`);
          } else if (cacheById) {
            console.log(`[MediaLoader] ✅ Cache encontrado por message_id para ${messageId}`);
            cacheData = cacheById;
          }
        }

        // 🆕 VERIFICAR SE É MÍDIA GRANDE
        const mediaIsLarge = isLargeMediaType(mediaType, cacheData?.file_size);
        setIsLargeMedia(mediaIsLarge);

        // PRIORIDADE 4: Base64 disponível (MELHOR OPÇÃO - SEMPRE FUNCIONA)
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

        // 🆕 PRIORIDADE 5: SE NÃO TEM BASE64 MAS TEM CACHE (ARQUIVO VAZIO/GRANDE)
        if (cacheData && !cacheData.base64_data) {
          console.log(`[MediaLoader] ⚠️ Cache encontrado mas sem Base64 - mídia grande ou com falha: ${messageId}`);
          
          // Se a URL original ainda existe, mostrar botão de download
          if (mediaUrl && mediaUrl.includes('mmg.whatsapp.net')) {
            console.log(`[MediaLoader] 🔽 Ativando botão de download para mídia grande: ${messageId}`);
            setShouldShowDownloadButton(true);
            setIsLoading(false);
            return;
          }
        }

        // PRIORIDADE 6: URL cached do Supabase Storage válida
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

        // PRIORIDADE 7: Tentar URL original do WhatsApp (pode ainda estar válida)
        if (mediaUrl && mediaUrl.includes('mmg.whatsapp.net')) {
          console.log(`[MediaLoader] 🌐 Tentando URL original do WhatsApp: ${messageId}`);
          try {
            const isAccessible = await checkUrlAccess(mediaUrl);
            if (isAccessible) {
              console.log(`[MediaLoader] ✅ URL original ainda válida para ${messageId}`);
              setFinalUrl(mediaUrl);
              setCachedUrl(messageId, mediaUrl);
              setIsLoading(false);
              return;
            } else {
              console.warn(`[MediaLoader] ⚠️ URL original expirou para ${messageId}`);
              // 🆕 Se URL expirou mas é mídia grande, ainda mostrar botão de download
              if (mediaIsLarge) {
                console.log(`[MediaLoader] 🔽 URL expirou mas ativando botão de download: ${messageId}`);
                setShouldShowDownloadButton(true);
                setIsLoading(false);
                return;
              }
            }
          } catch (urlError) {
            console.warn(`[MediaLoader] ⚠️ Erro ao verificar URL original: ${urlError}`);
          }
        }

        // PRIORIDADE 8: Tentar construir URL do Storage se não houver cache
        if (!cacheData) {
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
            console.warn(`[MediaLoader] ⚠️ Erro ao verificar Storage: ${storageError}`);
          }
        }

        // 🆕 ÚLTIMO RECURSO: BOTÃO DE DOWNLOAD SE TEMOS URL ORIGINAL
        if (mediaUrl) {
          console.log(`[MediaLoader] 🔽 Último recurso: Ativando botão de download: ${messageId}`);
          setShouldShowDownloadButton(true);
        } else {
          console.log(`[MediaLoader] ❌ Nenhuma URL disponível para ${messageId}`);
          setError('Mídia não disponível');
        }

      } catch (error) {
        console.error(`[MediaLoader] ❌ Erro ao carregar mídia ${messageId}:`, error);
        setError(`Erro ao carregar mídia: ${error.message}`);
        
        // 🆕 MESMO EM ERRO, SE TEMOS URL ORIGINAL, MOSTRAR BOTÃO
        if (mediaUrl) {
          setShouldShowDownloadButton(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadMedia();
  }, [messageId, mediaType, mediaUrl]);

  return {
    finalUrl,
    isLoading,
    error,
    // 🆕 NOVAS PROPRIEDADES
    shouldShowDownloadButton,
    originalUrl,
    isLargeMedia
  };
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
