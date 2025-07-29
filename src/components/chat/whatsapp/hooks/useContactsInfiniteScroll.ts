
import { useEffect } from 'react';

interface UseContactsInfiniteScrollProps {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  isLoadingMore?: boolean;
  hasMoreContacts?: boolean;
  onLoadMoreContacts?: () => Promise<void>;
}

export const useContactsInfiniteScroll = ({
  scrollContainerRef,
  isLoadingMore = false,
  hasMoreContacts = false,
  onLoadMoreContacts
}: UseContactsInfiniteScrollProps) => {
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !onLoadMoreContacts) return;

    let scrollTimer: NodeJS.Timeout | null = null;
    
    const handleScroll = () => {
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
      
      scrollTimer = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

        if (isNearBottom && hasMoreContacts && !isLoadingMore) {
          onLoadMoreContacts();
        }
      }, 100); // Debounce de 100ms
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, [onLoadMoreContacts, hasMoreContacts, isLoadingMore]);
};
