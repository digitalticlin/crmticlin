
/**
 * 🎯 HOOK DE SCROLL DETECTION OTIMIZADO
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * ✅ Detecção otimizada de scroll no topo
 * ✅ Throttling para melhor performance
 * ✅ Preservação de posição após carregar mais
 * ✅ Auto-scroll inteligente apenas quando necessário
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
  const scrollingDown = useRef<boolean>(false);

  // 🚀 CORREÇÃO: Função para detectar posição do scroll
  const detectScrollPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtTop = scrollTop <= 150; // 150px do topo
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 150; // 150px do final

    // Detectar direção do scroll
    scrollingDown.current = scrollTop > lastScrollTop.current;
    lastScrollTop.current = scrollTop;

    setIsNearTop(isAtTop);
    setIsNearBottom(isAtBottom);

    // 🚀 CORREÇÃO: Trigger loadMore quando próximo do topo
    if (isAtTop && hasMoreMessages && !isLoadingMore && onLoadMore) {
      console.log('[useScrollDetection] 📄 Carregando mais mensagens...');
      
      // Salvar posição atual
      const currentScrollHeight = scrollHeight;
      const currentScrollTop = scrollTop;

      onLoadMore().then(() => {
        // Restaurar posição após carregar
        setTimeout(() => {
          const newScrollHeight = container.scrollHeight;
          const addedHeight = newScrollHeight - currentScrollHeight;
          container.scrollTop = currentScrollTop + addedHeight;
        }, 100);
      });
    }
  }, [onLoadMore, hasMoreMessages, isLoadingMore]);

  // 🚀 CORREÇÃO: Throttled scroll handler
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

  // 🚀 CORREÇÃO: Auto-scroll para novas mensagens apenas se próximo do final
  const shouldAutoScroll = useCallback(() => {
    return isNearBottom && !scrollingDown.current;
  }, [isNearBottom]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior
    });
  }, []);

  return { 
    isNearTop, 
    isNearBottom, 
    shouldAutoScroll,
    scrollToBottom
  };
};
