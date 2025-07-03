
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ImageMessage } from './renderers/ImageMessage';
import { VideoMessage } from './renderers/VideoMessage';
import { AudioMessage } from './renderers/AudioMessage';
import { DocumentMessage } from './renderers/DocumentMessage';

interface MediaCache {
  id: string;
  message_id: string;
  cached_url: string | null;
  base64_data: string | null;
  media_type: string;
  file_size: number | null;
}

interface MessageMediaProps {
  messageId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  fileName?: string;
}

// CACHE GLOBAL ULTRA OTIMIZADO com batch loading
const globalMediaCache = new Map<string, MediaCache | null>();
const pendingRequests = new Set<string>();
const cacheTimestamps = new Map<string, number>();
const batchQueue = new Set<string>();
let batchTimeout: NodeJS.Timeout | null = null;

// Função de batch loading para múltiplas mídias
const processBatchRequests = async () => {
  if (batchQueue.size === 0) return;
  
  const messageIds = Array.from(batchQueue);
  batchQueue.clear();
  
  try {
    // Query em lote para múltiplas mídias
    const { data, error } = await supabase
      .from('media_cache')
      .select('*')
      .in('message_id', messageIds);

    if (error) {
      console.error('[MediaCache] Batch query error:', error);
      // Marcar todos como sem cache
      messageIds.forEach(id => {
        globalMediaCache.set(id, null);
        cacheTimestamps.set(id, Date.now());
        pendingRequests.delete(id);
      });
      return;
    }

    // Processar resultados
    const foundCaches = new Set<string>();
    
    (data || []).forEach((cache: MediaCache) => {
      globalMediaCache.set(cache.message_id, cache);
      cacheTimestamps.set(cache.message_id, Date.now());
      foundCaches.add(cache.message_id);
      pendingRequests.delete(cache.message_id);
    });

    // Marcar não encontrados como sem cache
    messageIds.forEach(id => {
      if (!foundCaches.has(id)) {
        globalMediaCache.set(id, null);
        cacheTimestamps.set(id, Date.now());
        pendingRequests.delete(id);
      }
    });

  } catch (error) {
    console.error('[MediaCache] Batch error:', error);
    // Marcar todos como sem cache em caso de erro
    messageIds.forEach(id => {
      globalMediaCache.set(id, null);
      cacheTimestamps.set(id, Date.now());
      pendingRequests.delete(id);
    });
  }
};

export const MessageMedia: React.FC<MessageMediaProps> = React.memo(({
  messageId,
  mediaType,
  mediaUrl,
  fileName
}) => {
  const [cachedMedia, setCachedMedia] = useState<MediaCache | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cacheChecked, setCacheChecked] = useState(false);
  const mountedRef = useRef(true);

  // Função auxiliar ANTES do useMemo
  const getDataUrlPrefix = (type: string) => {
    switch (type) {
      case 'image': return 'image/jpeg';
      case 'video': return 'video/mp4';
      case 'audio': return 'audio/ogg';
      case 'document': return 'application/pdf';
      default: return 'application/octet-stream';
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // Se já verificamos cache para esta mensagem
    if (cacheChecked) return;

    // Verificar cache global primeiro
    if (globalMediaCache.has(messageId)) {
      const cached = globalMediaCache.get(messageId);
      const cacheTime = cacheTimestamps.get(messageId) || 0;
      const isRecentCache = Date.now() - cacheTime < 300000; // 5 minutos

      if (isRecentCache) {
        setCachedMedia(cached);
        setCacheChecked(true);
        setIsLoading(false);
        return;
      } else {
        // Cache expirado - remover
        globalMediaCache.delete(messageId);
        cacheTimestamps.delete(messageId);
      }
    }

    // Se já está sendo processado, aguardar
    if (pendingRequests.has(messageId)) {
      // Aguardar resultado do batch
      const checkPending = () => {
        if (!mountedRef.current) return;
        
        if (globalMediaCache.has(messageId)) {
          const cached = globalMediaCache.get(messageId);
          setCachedMedia(cached);
          setCacheChecked(true);
          setIsLoading(false);
        } else {
          // Tentar novamente em breve
          setTimeout(checkPending, 100);
        }
      };
      setTimeout(checkPending, 50);
      return;
    }

    // Adicionar ao batch queue
    setIsLoading(true);
    pendingRequests.add(messageId);
    batchQueue.add(messageId);

    // Processar batch após pequeno delay para agrupar requests
    if (batchTimeout) clearTimeout(batchTimeout);
    batchTimeout = setTimeout(async () => {
      await processBatchRequests();
      
      // Verificar resultado após batch
      if (!mountedRef.current) return;
      
      if (globalMediaCache.has(messageId)) {
        const cached = globalMediaCache.get(messageId);
        setCachedMedia(cached);
        setCacheChecked(true);
        setIsLoading(false);
      }
    }, 50); // 50ms para agrupar requests

  }, [messageId, cacheChecked]);

  // Memoizar URL final com fallback inteligente
  const finalUrl = useMemo(() => {
    // Se ainda carregando, não retornar URL
    if (isLoading) {
      return null;
    }

    // Prioridade 1: Cache Base64 (permanente)
    if (cachedMedia?.base64_data) {
      return `data:${getDataUrlPrefix(mediaType)};base64,${cachedMedia.base64_data}`;
    }
    
    // Prioridade 2: Cache URL (permanente)
    if (cachedMedia?.cached_url) {
      return cachedMedia.cached_url;
    }
    
    // Prioridade 3: URL original (temporário, pode estar expirado)
    if (mediaUrl) {
      return mediaUrl;
    }
    
    // Sem URL disponível
    return null;
  }, [cachedMedia, mediaType, mediaUrl, isLoading]);

  // Renderização otimizada - Loading state minimalista
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg text-xs">
        <div className="animate-pulse w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="text-gray-500">Verificando...</span>
      </div>
    );
  }

  // Se não tem URL, mostrar placeholder simples
  if (!finalUrl) {
    return (
      <div className="p-2 bg-gray-50 rounded-lg text-xs text-gray-500">
        📎 Mídia indisponível
      </div>
    );
  }

  // Renderizar componente específico com loading=false (cache resolvido)
  const mediaProps = {
    messageId,
    url: finalUrl,
    isLoading: false, // Cache já resolvido
    isIncoming: true
  };

  switch (mediaType) {
    case 'image':
      return <ImageMessage {...mediaProps} />;
    case 'video':
      return <VideoMessage {...mediaProps} caption="" />;
    case 'audio':
      return <AudioMessage {...mediaProps} />;
    case 'document':
      return <DocumentMessage 
        {...mediaProps} 
        filename={fileName || 'Documento'} 
      />;
    default:
      return (
        <div className="p-2 bg-gray-50 rounded-lg text-xs text-gray-500">
          📎 Tipo não suportado: {mediaType}
        </div>
      );
  }
});

MessageMedia.displayName = "MessageMedia";
