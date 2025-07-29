
import React from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollLoaderProps {
  isLoading: boolean;
  onLoadMore?: () => Promise<void>;
  hasMore: boolean;
}

export const InfiniteScrollLoader: React.FC<InfiniteScrollLoaderProps> = ({
  isLoading,
  onLoadMore,
  hasMore
}) => {
  React.useEffect(() => {
    if (!isLoading && hasMore && onLoadMore) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            onLoadMore();
          }
        },
        { threshold: 1.0 }
      );

      const trigger = document.getElementById('infinite-scroll-trigger');
      if (trigger) {
        observer.observe(trigger);
      }

      return () => {
        if (trigger) {
          observer.unobserve(trigger);
        }
      };
    }
  }, [isLoading, hasMore, onLoadMore]);

  if (!hasMore) {
    return null;
  }

  return (
    <div 
      id="infinite-scroll-trigger"
      className="flex items-center justify-center py-4"
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando mais contatos...</span>
        </div>
      ) : (
        <div className="h-4" />
      )}
    </div>
  );
};
