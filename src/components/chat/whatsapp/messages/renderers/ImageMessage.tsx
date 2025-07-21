
import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon, RefreshCw } from 'lucide-react';

interface ImageMessageProps {
  messageId: string;
  url: string;
  caption?: string;
  isIncoming?: boolean;
  isLoading?: boolean;
}

export const ImageMessage = React.memo(({ 
  messageId, 
  url, 
  caption, 
  isIncoming,
  isLoading = false 
}: ImageMessageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleImageLoad = useCallback(() => {
    console.log(`[ImageMessage] ✅ Imagem carregada: ${messageId}`);
    setImageLoaded(true);
    setImageError(false);
    setRetryCount(0);
  }, [messageId]);

  const handleImageError = useCallback(() => {
    console.error(`[ImageMessage] ❌ Erro ao carregar imagem: ${messageId}`, {
      url: url?.substring(0, 50) + '...',
      isBase64: url?.startsWith('data:'),
      retryCount
    });
    setImageError(true);
    setImageLoaded(false);
  }, [messageId, url, retryCount]);

  const handleRetry = useCallback(() => {
    console.log(`[ImageMessage] 🔄 Tentando novamente: ${messageId} (tentativa ${retryCount + 1})`);
    setRetryCount(prev => prev + 1);
    setImageError(false);
    setImageLoaded(false);
  }, [messageId, retryCount]);

  const handleImageClick = useCallback(() => {
    if (imageLoaded && !imageError) {
      setIsFullscreen(true);
    }
  }, [imageLoaded, imageError]);

  const handleCloseFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullscreen(false);
  }, []);

  // Estado de loading
  if (isLoading) {
    return (
      <div className="w-48 h-32 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce"></div>
          <span className="text-xs text-gray-500">Carregando imagem...</span>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (imageError || !url) {
    return (
      <div className="w-48 h-32 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
        <div className="text-center">
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <span className="text-xs text-gray-500 block mb-2">Imagem indisponível</span>
          {retryCount < 3 && (
            <button
              onClick={handleRetry}
              className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mx-auto"
            >
              <RefreshCw className="w-3 h-3" />
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 max-w-xs">
        <div className="relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity">
          {/* Loading placeholder */}
          {!imageLoaded && (
            <div className="absolute inset-0 w-48 h-32 bg-gray-100 flex items-center justify-center z-10">
              <div className="animate-pulse flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce"></div>
                <span className="text-xs text-gray-500">Carregando...</span>
              </div>
            </div>
          )}
          
          {/* Imagem principal */}
          <img 
            src={url} 
            alt="Imagem compartilhada"
            className={cn(
              "max-w-full h-auto rounded-lg object-cover transition-opacity duration-300",
              !imageLoaded && "opacity-0"
            )}
            onClick={handleImageClick}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
            style={{ 
              maxWidth: '250px', 
              maxHeight: '200px',
              minHeight: imageLoaded ? 'auto' : '128px'
            }}
            key={`${messageId}-${retryCount}`} // Force re-render on retry
          />
        </div>
        
        {/* Caption */}
        {caption && caption !== '[Imagem]' && caption !== '[Mensagem não suportada]' && (
          <p className="text-sm text-gray-700 leading-relaxed break-words">{caption}</p>
        )}
      </div>

      {/* Modal fullscreen */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4"
          onClick={handleCloseFullscreen}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={url} 
              alt="Imagem em tela cheia"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={handleCloseFullscreen}
              className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
});

ImageMessage.displayName = 'ImageMessage';
