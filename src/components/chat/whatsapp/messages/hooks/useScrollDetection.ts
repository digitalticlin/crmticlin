
/**
 * 🎯 HOOK DE SCROLL DETECTION SEM CONFLITOS
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * ✅ Removido scroll automático conflitante
 * ✅ Foco apenas na detecção e paginação
 * ✅ Throttling otimizado para performance
 * ✅ Preservação de posição após carregar mais
 */

import { useEffect, useState, useRef, useCallback } from 'react';

interface UseScrollDetectionProps {
  containerRef: React.RefObject<HTMLDivElement>;
  onLoadMore?: () => Promise<void>;
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;
}

export const useScrollDetection = ({
  containerRef,
  onLoadMore,
  hasMoreMessages = false,
  isLoadingMore = false
}: UseScrollDetectionProps) => {
  const [isNearTop, setIsNearTop] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const lastScrollTop = useRef<number>(0);
  const isLoadingRef = useRef(false);

  // 🚀 CORREÇÃO: Função apenas para detectar posição (sem scroll automático)
  const detectScrollPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtTop = scrollTop <= 150;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 150;

    lastScrollTop.current = scrollTop;
    setIsNearTop(isAtTop);
    setIsNearBottom(isAtBottom);

    // 🚀 CORREÇÃO: Trigger loadMore apenas quando necessário
    if (isAtTop && hasMoreMessages && !isLoadingMore && !isLoadingRef.current && onLoadMore) {
      console.log('[useScrollDetection] 📄 Carregando mais mensagens...');
      
      isLoadingRef.current = true;
      
      // Salvar posição atual para restauração
      const currentScrollHeight = scrollHeight;
      const currentScrollTop = scrollTop;

      onLoadMore().then(() => {
        // Preservar posição após carregar mensagens antigas
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            const addedHeight = newScrollHeight - currentScrollHeight;
            // Manter usuário na mesma posição relativa
            const newPosition = currentScrollTop + addedHeight;
            container.scrollTop = Math.max(0, newPosition);
            
            console.log('[useScrollDetection] 📍 Posição restaurada:', {
              oldHeight: currentScrollHeight,
              newHeight: newScrollHeight,
              addedHeight,
              newPosition
            });
          }
          isLoadingRef.current = false;
        }, 100); // Tempo otimizado
      }).catch(() => {
        isLoadingRef.current = false;
      });
    }
  }, [onLoadMore, hasMoreMessages, isLoadingMore]);

  // 🚀 CORREÇÃO: Throttled scroll handler otimizado
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimer: NodeJS.Timeout | null = null;
    
    const handleScroll = () => {
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
      
      scrollTimer = setTimeout(() => {
        detectScrollPosition();
      }, 16); // ~60fps throttling
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Detectar posição inicial
    detectScrollPosition();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, [detectScrollPosition]);

  return { 
    isNearTop, 
    isNearBottom
  };
};
