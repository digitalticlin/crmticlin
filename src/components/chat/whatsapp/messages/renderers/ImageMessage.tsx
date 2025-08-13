
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon, RefreshCw, ZoomIn, X } from 'lucide-react';

interface ImageMessageProps {
  messageId: string;
  url: string;
  caption?: string; // ✅ OPCIONAL
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
  const [zoom, setZoom] = useState(1);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = useCallback(() => {
    // ✅ OTIMIZAÇÃO: Log condicionado para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ImageMessage] ✅ Imagem carregada: ${messageId.substring(0, 8)}`);
    }
    setImageLoaded(true);
    setImageError(false);
  }, [messageId]);

  const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.target as HTMLImageElement;
    const isSupabaseStorage = url?.includes('supabase.co/storage');
    const errorDetails = {
      messageId: messageId.substring(0, 8),
      url: url?.substring(0, 80) + '...',
      naturalWidth: target.naturalWidth,
      naturalHeight: target.naturalHeight,
      retryCount,
      // ✅ DEBUG ESPECÍFICO PARA FORMATO E ORIGEM
      isJPEG: url?.includes('image/jpeg') || url?.includes('.jpg') || url?.includes('.jpeg'),
      isPNG: url?.includes('image/png') || url?.includes('.png'),
      isSupabaseStorage,
      startsWithData: url?.startsWith('data:'),
      mimeType: url?.match(/data:([^;]+);base64/)?.[1] || 'unknown',
      isHttps: url?.startsWith('https://'),
      hasParams: url?.includes('?')
    };
    
    // ✅ MELHOR TRATAMENTO: Log mais detalhado apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ImageMessage] ❌ Erro ao carregar imagem:`, errorDetails);
      
      // ✅ LOG ESPECÍFICO PARA SUPABASE STORAGE
      if (isSupabaseStorage) {
        console.error(`[ImageMessage] 🗄️ SUPABASE STORAGE ERROR:`, {
          fullUrl: url,
          messageId,
          possibleCause: 'CORS, autenticação ou arquivo não existe',
          suggestion: 'Verificar RLS policies e bucket permissions'
        });
      }
      
      // ✅ LOG EXTRA PARA JPEG
      if (errorDetails.isJPEG) {
        console.error(`[ImageMessage] 🔍 JPEG ERROR DETAILS:`, {
          fullUrl: url,
          messageId,
          hasRetryParams: url?.includes('?retry='),
          isOptimistic: messageId?.includes('temp_')
        });
      }
    }
    
    setImageError(true);
    setImageLoaded(false);
  }, [messageId, url, retryCount]);

  const handleRetry = useCallback(() => {
    if (retryCount >= 3) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[ImageMessage] ⚠️ Limite de tentativas atingido para: ${messageId.substring(0, 8)}`);
      }
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ImageMessage] 🔄 Tentando novamente: ${messageId.substring(0, 8)} (tentativa ${retryCount + 1})`);
    }
    
    // ✅ SIMPLES E EFICAZ: React cuida do reload via key change
    setRetryCount(prev => prev + 1);
    setImageError(false);
    setImageLoaded(false);
  }, [messageId, retryCount]);

  const handleImageClick = useCallback(() => {
    if (imageLoaded && !imageError) {
      setIsFullscreen(true);
      setZoom(1);
    }
  }, [imageLoaded, imageError]);

  const handleZoomIn = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((z) => Math.min(4, parseFloat((z + 0.25).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))));
  }, []);

  const handleZoomReset = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(1);
  }, []);

  // Foco no overlay para receber ESC
  useEffect(() => {
    if (isFullscreen) {
      setTimeout(() => overlayRef.current?.focus(), 0);
    }
  }, [isFullscreen]);

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

  // Error state com melhor UX
  if (imageError || !url) {
    const isUrlError = !url;
    const isPermanentError = retryCount >= 3;
    
    return (
      <div className="w-64 h-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
        <div className="text-center p-4">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          
          <span className="text-sm text-gray-600 block mb-2 font-medium">
            {isUrlError ? 'Imagem indisponível' : 'Erro ao carregar'}
          </span>
          
          <span className="text-xs text-gray-500 block mb-3">
            {isUrlError 
              ? 'Link da imagem não foi encontrado' 
              : isPermanentError 
                ? 'Imagem pode ter expirado ou estar corrompida'
                : 'Tente carregar novamente'
            }
          </span>
          
          {!isUrlError && !isPermanentError && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente ({3 - retryCount} tentativas)
            </button>
          )}
          
          {isPermanentError && url && (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors underline"
            >
              Ver link original
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 max-w-xs">
        <div
          className="relative overflow-hidden rounded-lg bg-gray-100 group cursor-pointer hover:opacity-95 transition-all duration-200"
          onClick={handleImageClick}
        >
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
            <button
              type="button"
              aria-label="Ampliar imagem"
              title="Ampliar"
              onClick={handleImageClick}
              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
              style={{ outline: 'none', border: 'none' }}
            >
              <ZoomIn className="w-8 h-8 text-white" />
            </button>
          )}
          
          {/* Imagem principal */}
          <img 
            src={url.startsWith('data:') ? url : (retryCount > 0 ? `${url}?retry=${retryCount}&t=${Date.now()}` : url)}
            alt="Imagem compartilhada"
            className={cn(
              "max-w-full h-auto rounded-lg object-cover transition-opacity duration-300",
              !imageLoaded && "opacity-0"
            )}
            // clique também disponível no wrapper/overlay
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
            style={{ 
              maxWidth: '300px', 
              maxHeight: '250px',
              minHeight: imageLoaded ? 'auto' : '160px'
            }}
            key={`${messageId}-${retryCount}`}
            data-message-id={messageId}
            // ✅ HEADERS ESPECÍFICOS PARA SUPABASE STORAGE
            referrerPolicy="no-referrer"
            crossOrigin={url?.includes('supabase.co/storage') ? 'anonymous' : undefined}
          />
        </div>
        
                 {/* Caption removido conforme solicitado */}
      </div>

      {/* Modal fullscreen */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[9999] p-4 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsFullscreen(false)}
          onKeyDown={(e) => { if ((e as React.KeyboardEvent).key === 'Escape') setIsFullscreen(false); }}
          tabIndex={-1}
          ref={overlayRef}
        >
          {/* Fundo glasmorphism */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 30% 70%, rgba(211,216,0,0.15) 0%, transparent 50%), " +
                "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 60%), " +
                "linear-gradient(135deg, rgba(23,25,28,0.65) 0%, rgba(23,25,28,0.85) 100%)",
              backdropFilter: 'blur(16px)'
            }}
          />

          <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* Área rolável para pan/zoom */}
            <div className="relative max-w-full max-h-full w-full h-full overflow-auto rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl">
              <img 
                src={url} 
                alt="Imagem em tela cheia"
                className="block mx-auto"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 120ms ease' }}
                onDoubleClick={(e) => { e.stopPropagation(); setZoom((z) => (z === 1 ? 2 : 1)); }}
              />
            </div>

            {/* Controles */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30"
                aria-label="Reduzir zoom"
              >−</button>
              <button
                onClick={handleZoomIn}
                className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30"
                aria-label="Aumentar zoom"
              >+</button>
              <button
                onClick={handleZoomReset}
                className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30"
                aria-label="Redefinir zoom"
              >1×</button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-white border border-white/30"
                aria-label="Fechar"
              >×</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ImageMessage.displayName = 'ImageMessage';
