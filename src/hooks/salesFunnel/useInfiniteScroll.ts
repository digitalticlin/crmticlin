/**
 * Hook para Scroll Infinito - ISOLADO PARA SALES FUNNEL
 * 
 * Responsabilidades:
 * ✅ Detectar quando usuário chegou ao final da lista
 * ✅ Carregar mais itens automaticamente
 * ✅ Gerenciar estados de carregamento
 * ✅ Performance otimizada com IntersectionObserver
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInfiniteScrollParams {
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  threshold?: number; // Distância do final para iniciar carregamento (em pixels)
  rootMargin?: string; // Margem para o IntersectionObserver
}

interface UseInfiniteScrollReturn {
  isLoading: boolean;
  sentinelRef: React.RefObject<HTMLDivElement>;
  loadMore: () => Promise<void>;
}

export const useInfiniteScroll = ({
  hasMore,
  onLoadMore,
  threshold = 200,
  rootMargin = '0px 0px 200px 0px'
}: UseInfiniteScrollParams): UseInfiniteScrollReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false); // Previne múltiplas chamadas simultâneas

  // Função para carregar mais itens
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    try {
      loadingRef.current = true;
      setIsLoading(true);
      
      console.log('[useInfiniteScroll] 📜 Carregando mais itens...');
      await onLoadMore();
      console.log('[useInfiniteScroll] ✅ Itens carregados com sucesso');
      
    } catch (error) {
      console.error('[useInfiniteScroll] ❌ Erro ao carregar mais itens:', error);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [hasMore, onLoadMore]);

  // Configurar IntersectionObserver
  useEffect(() => {
    const currentSentinel = sentinelRef.current;
    
    if (!currentSentinel) return;

    // Limpar observer anterior
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Criar novo observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        
        if (entry.isIntersecting && hasMore && !loadingRef.current) {
          console.log('[useInfiniteScroll] 👁️ Sentinel visível - iniciando carregamento');
          loadMore();
        }
      },
      {
        root: null, // viewport
        rootMargin,
        threshold: 0.1
      }
    );

    // Observar o sentinel
    observerRef.current.observe(currentSentinel);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadMore, rootMargin]);

  // Cleanup geral
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    isLoading,
    sentinelRef,
    loadMore
  };
};