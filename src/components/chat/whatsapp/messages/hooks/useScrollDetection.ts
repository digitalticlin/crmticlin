
import { useEffect, useState, useRef } from 'react';

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onLoadMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtTop = scrollTop <= 100; // 100px do topo
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px do final

      setIsNearTop(isAtTop);

      // Carregar mais mensagens quando scroll está próximo do topo
      if (isAtTop && hasMoreMessages && !isLoadingMore) {
        // Salvar posição atual antes de carregar mais
        const currentScrollHeight = scrollHeight;
        const currentScrollTop = scrollTop;

        onLoadMore().then(() => {
          // Restaurar posição após carregar novas mensagens
          setTimeout(() => {
            const newScrollHeight = container.scrollHeight;
            const addedHeight = newScrollHeight - currentScrollHeight;
            container.scrollTop = currentScrollTop + addedHeight;
          }, 50);
        });
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, hasMoreMessages, isLoadingMore]);

  return { isNearTop };
};
