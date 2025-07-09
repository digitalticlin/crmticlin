
import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ImageMessageProps {
  messageId: string;
  url: string;
  caption?: string;
  isIncoming?: boolean;
  isLoading?: boolean;
}

export const ImageMessage = React.memo(({ messageId, url, caption, isIncoming, isLoading = false }: ImageMessageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    console.error('Erro ao carregar imagem:', url);
    setImageError(true);
  }, [url]);

  const handleImageClick = useCallback(() => {
    window.open(url, '_blank');
  }, [url]);

  if (imageError) {
    return (
      <div className="w-48 h-32 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
        <span className="text-xs text-gray-500">❌ Imagem indisponível</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-w-xs">
      <div className="relative overflow-hidden rounded-lg bg-gray-100">
        {!imageLoaded && (
          <div className="absolute inset-0 w-48 h-32 bg-gray-100 flex items-center justify-center">
            <div className="animate-pulse w-3 h-3 bg-gray-300 rounded-full"></div>
          </div>
        )}
        <img 
          src={url} 
          alt="Imagem compartilhada"
          className={cn(
            "max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity duration-200 rounded-lg",
            !imageLoaded && "opacity-0"
          )}
          onClick={handleImageClick}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          style={{ 
            maxWidth: '250px', 
            maxHeight: '200px',
            objectFit: 'cover',
            minHeight: imageLoaded ? 'auto' : '128px'
          }}
        />
      </div>
      {caption && caption !== '[Imagem]' && (
        <p className="text-sm text-gray-700 leading-relaxed">{caption}</p>
      )}
    </div>
  );
});

ImageMessage.displayName = 'ImageMessage';
