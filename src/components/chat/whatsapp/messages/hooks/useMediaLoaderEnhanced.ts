
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseMediaLoaderProps {
  messageId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  mediaCache?: {
    id: string;
    base64_data?: string | null;
    original_url?: string | null;
    cached_url?: string | null;
    file_size?: number | null;
    media_type?: string | null;
  } | null;
}

interface UseMediaLoaderReturn {
  finalUrl: string | null;
  isLoading: boolean;
  error: string | null;
  canRetry: boolean;
  retry: () => void;
  mediaStatus: 'loading' | 'loaded' | 'error' | 'not_found';
}

// Cache local para evitar buscas redundantes
const searchCache = new Map<string, string | null>();

export const useMediaLoaderEnhanced = ({ 
  messageId, 
  mediaType, 
  mediaUrl,
  mediaCache 
}: UseMediaLoaderProps): UseMediaLoaderReturn => {
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadMedia = useCallback(async () => {
    console.log(`[MediaLoaderEnhanced] 🔄 Carregando mídia: ${messageId.substring(0, 8)} (${mediaType})`);
    
    setIsLoading(true);
    setError(null);

    try {
      // ✅ PRIORIDADE 1: Base64 já presente no cache da mensagem
      if (mediaCache?.base64_data) {
        const mimeType = getMimeType(mediaType, mediaCache);
        
        // Verificar se já é uma URL base64 completa
        let dataUrl: string;
        if (mediaCache.base64_data.startsWith('data:')) {
          dataUrl = mediaCache.base64_data;
        } else {
          dataUrl = `data:${mimeType};base64,${mediaCache.base64_data}`;
        }
        
        console.log(`[MediaLoaderEnhanced] ✅ Base64 encontrado no cache: ${messageId.substring(0, 8)}`);
        setFinalUrl(dataUrl);
        searchCache.set(messageId, dataUrl);
        setIsLoading(false);
        return;
      }

      // ✅ PRIORIDADE 2: URL do Storage Supabase
      const storageUrl = mediaCache?.cached_url || mediaCache?.original_url;
      if (storageUrl && storageUrl.includes('supabase.co/storage')) {
        console.log(`[MediaLoaderEnhanced] 🗄️ Storage URL encontrada: ${messageId.substring(0, 8)}`);
        setFinalUrl(storageUrl);
        searchCache.set(messageId, storageUrl);
        setIsLoading(false);
        return;
      }

      // ✅ PRIORIDADE 3: Cache local (evitar buscas redundantes)
      const cachedUrl = searchCache.get(messageId);
      if (cachedUrl) {
        console.log(`[MediaLoaderEnhanced] 💾 Cache local encontrado: ${messageId.substring(0, 8)}`);
        setFinalUrl(cachedUrl);
        setIsLoading(false);
        return;
      }

      // ✅ PRIORIDADE 4: Buscar media_cache na base de dados
      console.log(`[MediaLoaderEnhanced] 🔍 Buscando media_cache na base de dados: ${messageId.substring(0, 8)}`);
      
      const { data: dbMediaCache, error: dbError } = await supabase
        .from('media_cache')
        .select('id, base64_data, original_url, cached_url, media_type, file_size')
        .eq('message_id', messageId)
        .maybeSingle();

      if (dbError) {
        console.warn(`[MediaLoaderEnhanced] ⚠️ Erro ao buscar cache: ${dbError.message}`);
        throw new Error('Erro ao buscar mídia no cache');
      }

      if (dbMediaCache?.base64_data) {
        const mimeType = getMimeType(mediaType, dbMediaCache);
        let dataUrl: string;
        
        if (dbMediaCache.base64_data.startsWith('data:')) {
          dataUrl = dbMediaCache.base64_data;
        } else {
          dataUrl = `data:${mimeType};base64,${dbMediaCache.base64_data}`;
        }
        
        console.log(`[MediaLoaderEnhanced] ✅ Base64 encontrado na DB: ${messageId.substring(0, 8)}`);
        setFinalUrl(dataUrl);
        searchCache.set(messageId, dataUrl);
        setIsLoading(false);
        return;
      }

      if (dbMediaCache?.cached_url && dbMediaCache.cached_url.includes('supabase.co/storage')) {
        console.log(`[MediaLoaderEnhanced] 🗄️ Storage URL encontrada na DB: ${messageId.substring(0, 8)}`);
        setFinalUrl(dbMediaCache.cached_url);
        searchCache.set(messageId, dbMediaCache.cached_url);
        setIsLoading(false);
        return;
      }

      // ✅ PRIORIDADE 5: URL original (pode ainda estar válida)
      const originalUrl = dbMediaCache?.original_url || mediaUrl;
      if (originalUrl && originalUrl.includes('mmg.whatsapp.net')) {
        try {
          // Testar se URL ainda está acessível
          const response = await fetch(originalUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log(`[MediaLoaderEnhanced] 🌐 URL original ainda válida: ${messageId.substring(0, 8)}`);
            setFinalUrl(originalUrl);
            searchCache.set(messageId, originalUrl);
            setIsLoading(false);
            return;
          }
        } catch {
          console.warn(`[MediaLoaderEnhanced] ⚠️ URL original expirada: ${messageId.substring(0, 8)}`);
        }
      }

      // ❌ Não encontrou mídia disponível
      console.log(`[MediaLoaderEnhanced] ❌ Mídia não encontrada: ${messageId.substring(0, 8)}`);
      setError('Mídia não disponível');
      searchCache.set(messageId, null);

    } catch (err) {
      console.error(`[MediaLoaderEnhanced] ❌ Erro ao carregar mídia:`, err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [messageId, mediaType, mediaUrl, mediaCache, retryCount]);

  const retry = useCallback(() => {
    console.log(`[MediaLoaderEnhanced] 🔄 Retry #${retryCount + 1}: ${messageId.substring(0, 8)}`);
    setRetryCount(prev => prev + 1);
    searchCache.delete(messageId); // Limpar cache para nova tentativa
  }, [messageId, retryCount]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const mediaStatus = (() => {
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (finalUrl) return 'loaded';
    return 'not_found';
  })();

  return {
    finalUrl,
    isLoading,
    error,
    canRetry: retryCount < 3 && !!error,
    retry,
    mediaStatus: mediaStatus as any
  };
};

// ✅ HELPER: Determinar MIME type
const getMimeType = (mediaType: string, mediaCache?: any): string => {
  // Se tem tipo específico no cache, usar
  if (mediaCache?.media_type) {
    const typeMap: Record<string, string> = {
      'image': 'image/jpeg',
      'video': 'video/mp4',
      'audio': 'audio/ogg',
      'document': 'application/pdf'
    };
    return typeMap[mediaCache.media_type] || 'application/octet-stream';
  }

  // Fallback baseado no mediaType
  switch (mediaType) {
    case 'image': return 'image/jpeg';
    case 'video': return 'video/mp4';
    case 'audio': return 'audio/ogg';
    case 'document': return 'application/pdf';
    default: return 'application/octet-stream';
  }
};
