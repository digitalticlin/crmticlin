
import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon, RefreshCw, ZoomIn } from 'lucide-react';

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
  }, [messageId]);

  const handleImageError = useCallback(() => {
    console.error(`[ImageMessage] ❌ Erro ao carregar imagem: ${messageId}`);
    setImageError(true);
    setImageLoaded(false);
  }, [messageId]);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-64 h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-gray-500">Carregando...</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
      </div>
    );
  }

  // Error state
  if (imageError || !url) {
    return (
      <div className="w-64 h-40 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
        <div className="text-center p-4">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <span className="text-sm text-gray-500 block mb-3">Imagem não disponível</span>
          {retryCount < 3 && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
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
        <div className="relative overflow-hidden rounded-lg bg-gray-100 group cursor-pointer hover:opacity-95 transition-all duration-200">
          {/* Loading placeholder overlay */}
          {!imageLoaded && (
            <div className="absolute inset-0 w-64 h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center z-10">
              <div className="animate-pulse flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
          
          {/* Zoom overlay */}
          {imageLoaded && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
              <ZoomIn className="w-8 h-8 text-white" />
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
              maxWidth: '300px', 
              maxHeight: '250px',
              minHeight: imageLoaded ? 'auto' : '160px'
            }}
            key={`${messageId}-${retryCount}`}
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
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={url} 
              alt="Imagem em tela cheia"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
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
