
import { useState, useCallback } from 'react';

interface MediaCacheItem {
  url: string;
  expires: number;
  type: string;
}

const CACHE_KEY = 'whatsapp_media_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export const useMediaCache = () => {
  const [cache, setCache] = useState<Record<string, MediaCacheItem>>(() => {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    } catch {
      return {};
    }
  });

  const getCachedMedia = useCallback((messageId: string): string | null => {
    const item = cache[messageId];
    if (item && item.expires > Date.now()) {
      return item.url;
    }
    return null;
  }, [cache]);

  const setCachedMedia = useCallback((messageId: string, url: string, type: string) => {
    const newCache = {
      ...cache,
      [messageId]: {
        url,
        type,
        expires: Date.now() + CACHE_DURATION
      }
    };
    
    setCache(newCache);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
    } catch (error) {
      console.warn('Erro ao salvar cache no localStorage:', error);
    }
  }, [cache]);

  const clearExpiredCache = useCallback(() => {
    const now = Date.now();
    const validCache = Object.fromEntries(
      Object.entries(cache).filter(([, item]) => item.expires > now)
    );
    
    setCache(validCache);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(validCache));
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
  }, [cache]);

  return {
    getCachedMedia,
    setCachedMedia,
    clearExpiredCache
  };
};
