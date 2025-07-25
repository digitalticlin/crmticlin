
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseMediaLoaderProps {
  messageId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  // ✅ NOVO: Receber media_cache diretamente da mensagem
  mediaCache?: {
    id: string;
    base64_data?: string | null;
    original_url?: string | null;
    file_size?: number | null;
    media_type?: string | null;
  } | null;
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
  mediaUrl,
  mediaCache 
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
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MediaLoader] 🔍 Carregando mídia para ${messageId.substring(0, 8)} (${mediaType})`);
      }
      setIsLoading(true);
      setError(null);
      setShouldShowDownloadButton(false);
      setOriginalUrl(mediaUrl || null);

      try {
        // ✅ PRIORIDADE 0: Se media_url já é Base64, validar e corrigir se necessário
        if (mediaUrl && mediaUrl.startsWith('data:')) {
          console.log(`[MediaLoader] 🎯 Base64 direto no media_url para ${messageId.substring(0, 8)}`);
          
          // 🔧 CORREÇÃO: Detectar e corrigir Base64 inválido
          const base64Match = mediaUrl.match(/data:([^;]+);base64,(.+)/);
          if (base64Match) {
            const [, mimeType, base64Data] = base64Match;
            
            // Verificar se Base64 é válido para mídia
            if (base64Data.length < 100 || !base64Data.match(/^[A-Za-z0-9+/=]+$/)) {
              console.warn(`[MediaLoader] ⚠️ Base64 inválido detectado para ${messageId.substring(0, 8)}, tentando cache...`);
              // Não usar media_url inválido, continuar para outras prioridades
            } else {
              setFinalUrl(mediaUrl);
              setCachedUrl(messageId, mediaUrl);
              setIsLoading(false);
              return;
            }
          }
        }

        // ✅ PRIORIDADE 1: Cache local válido
        const cachedUrl = getCachedUrl(messageId);
        if (cachedUrl) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[MediaLoader] 💾 Cache local encontrado para ${messageId.substring(0, 8)}`);
          }
          setFinalUrl(cachedUrl);
          setIsLoading(false);
          return;
        }

        // ✅ PRIORIDADE 2: Media cache já disponível (da query principal)
        let cacheData = null;
        if (mediaCache) {
          console.log(`[MediaLoader] 🚀 Usando cache da mensagem para ${messageId}`);
          cacheData = mediaCache;
        } else if (mediaUrl && !mediaUrl.startsWith('data:')) {
          // Fallback: buscar por original_url apenas se não temos cache E não é base64
          console.log(`[MediaLoader] 🔄 Fallback: Buscando cache por URL: ${mediaUrl.substring(0, 80)}...`);
          
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

        // 🆕 VERIFICAR SE É MÍDIA GRANDE
        const mediaIsLarge = isLargeMediaType(mediaType, cacheData?.file_size);
        setIsLargeMedia(mediaIsLarge);

        // PRIORIDADE 4: Base64 disponível (MELHOR OPÇÃO - SEMPRE FUNCIONA)
        if (cacheData?.base64_data) {
          try {
            // 🔧 VALIDAÇÃO: Verificar se Base64 é válido
            const base64Data = cacheData.base64_data;
            if (base64Data.length < 100 || !base64Data.match(/^[A-Za-z0-9+/=]+$/)) {
              console.warn(`[MediaLoader] ⚠️ Base64 inválido detectado no cache para ${messageId}, tentando Storage...`);
            } else {
              const mimeType = getMimeType(mediaType);
              const dataUrl = `data:${mimeType};base64,${base64Data}`;
              console.log(`[MediaLoader] ✅ Base64 encontrado para ${messageId} (${(base64Data.length / 1024).toFixed(1)}KB)`);
              setFinalUrl(dataUrl);
              setCachedUrl(messageId, dataUrl);
              setIsLoading(false);
              return;
            }
          } catch (base64Error) {
            console.warn(`[MediaLoader] ⚠️ Erro ao processar Base64: ${base64Error}`);
          }
        }

        // ✅ PRIORIDADE 5: URL do Supabase Storage (MOVIDO PARA CIMA!)
        const storageUrl = cacheData?.cached_url || cacheData?.original_url;
        console.log(`[MediaLoader] 🔍 DEBUG Storage URL para ${messageId}:`, { storageUrl, hasCache: !!cacheData });
        
        if (storageUrl && (storageUrl.includes('supabase.co/storage') || storageUrl.includes('.supabase.co/storage'))) {
          console.log(`[MediaLoader] ✅ Usando URL do Storage para ${messageId}: ${storageUrl.substring(0, 80)}...`);
          // Para Storage do Supabase, usar diretamente - são URLs públicas confiáveis
          setFinalUrl(storageUrl);
          setCachedUrl(messageId, storageUrl);
          setIsLoading(false);
          return;
        }

        // 🆕 PRIORIDADE 6: SE NÃO TEM BASE64 E NEM STORAGE (ARQUIVO VAZIO/GRANDE)
        if (cacheData && !cacheData.base64_data && !storageUrl) {
          console.log(`[MediaLoader] ⚠️ Cache encontrado mas sem Base64 e sem Storage - mídia com falha: ${messageId}`);
          
          // Se a URL original ainda existe, mostrar botão de download
          if (mediaUrl && mediaUrl.includes('mmg.whatsapp.net') && !mediaUrl.startsWith('data:')) {
            console.log(`[MediaLoader] 🔽 Ativando botão de download para mídia com falha: ${messageId}`);
            setShouldShowDownloadButton(true);
            setIsLoading(false);
            return;
          }
        }

        // PRIORIDADE 7: Tentar URL original do WhatsApp (pode ainda estar válida)
        if (mediaUrl && mediaUrl.includes('mmg.whatsapp.net') && !mediaUrl.startsWith('data:')) {
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
              if (mediaIsLarge && mediaUrl && !mediaUrl.startsWith('data:')) {
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

        // ❌ REMOVIDO: PRIORIDADE 8 - URLs construídas incorretamente
        // Motivo: As URLs no Storage incluem timestamp, não apenas messageId
        // Esta prioridade estava criando URLs inválidas como:
        // /storage/.../messageId.jpg ao invés de /storage/.../messageId_timestamp.jpg

        // 🆕 ÚLTIMO RECURSO: BOTÃO DE DOWNLOAD SE TEMOS URL ORIGINAL VÁLIDA
        if (mediaUrl && !mediaUrl.startsWith('data:') && mediaUrl.includes('mmg.whatsapp.net')) {
          console.log(`[MediaLoader] 🔽 Último recurso: Ativando botão de download: ${messageId}`);
          setShouldShowDownloadButton(true);
        } else {
          console.log(`[MediaLoader] ❌ Nenhuma URL válida disponível para ${messageId}`);
          setError('Mídia não disponível');
        }

      } catch (error) {
        console.error(`[MediaLoader] ❌ Erro ao carregar mídia ${messageId}:`, error);
        setError(`Erro ao carregar mídia: ${error.message}`);
        
        // 🆕 MESMO EM ERRO, SE TEMOS URL ORIGINAL VÁLIDA, MOSTRAR BOTÃO
        if (mediaUrl && !mediaUrl.startsWith('data:') && mediaUrl.includes('mmg.whatsapp.net')) {
          setShouldShowDownloadButton(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadMedia();
  }, [messageId, mediaType, mediaUrl, mediaCache]);

  return {
    finalUrl,
    isLoading,
    error,
    // 🆕 NOVOS RETORNOS
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
