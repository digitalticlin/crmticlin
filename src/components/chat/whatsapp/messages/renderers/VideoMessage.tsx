
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PlayIcon, VideoIcon, Loader2, RefreshCw } from 'lucide-react';

interface VideoMessageProps {
  messageId: string;
  url: string;
  caption?: string; // ✅ OPCIONAL ao invés de obrigatório
  isIncoming?: boolean;
  isLoading?: boolean;
}

export const VideoMessage = React.memo(({ 
  messageId, 
  url, 
  caption, 
  isIncoming, 
  isLoading = false 
}: VideoMessageProps) => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleVideoError = useCallback(() => {
    console.error(`[VideoMessage] ❌ Erro ao carregar vídeo: ${messageId}`);
    setVideoError(true);
    setVideoLoading(false);
  }, [messageId]);

  const handleVideoLoad = useCallback(() => {
    console.log(`[VideoMessage] ✅ Vídeo carregado: ${messageId}`);
    setVideoLoading(false);
    setVideoError(false);
  }, [messageId]);

  const handleRetry = useCallback(() => {
    console.log(`[VideoMessage] 🔄 Tentando novamente: ${messageId} (tentativa ${retryCount + 1})`);
    setRetryCount(prev => prev + 1);
    setVideoError(false);
    setVideoLoading(true);
  }, [messageId, retryCount]);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  const handleOpenFullscreen = useCallback(() => {
    if (!videoError) {
      setIsFullscreen(true);
      setZoom(1);
    }
  }, [videoError]);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(3, parseFloat((z + 0.25).toFixed(2)))), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(0.75, parseFloat((z - 0.25).toFixed(2)))), []);
  const handleZoomReset = useCallback(() => setZoom(1), []);

  useEffect(() => {
    if (isFullscreen) {
      setTimeout(() => overlayRef.current?.focus(), 0);
    }
  }, [isFullscreen]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="w-80 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center animate-pulse">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm text-gray-500">Carregando vídeo...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (videoError || !url) {
    return (
      <div className="space-y-2">
        <div className={cn(
          "flex items-center justify-center p-6 rounded-lg border-2 border-dashed max-w-xs h-48",
          isIncoming ? "border-gray-300 bg-gray-50" : "border-white/30 bg-white/10"
        )}>
          <div className="text-center">
            <VideoIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <span className="text-sm opacity-70 block mb-3">Vídeo não disponível</span>
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
        {/* Caption removido - apenas vídeo sem descrição */}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative max-w-sm">
        {/* Loading overlay */}
        {videoLoading && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center rounded-lg z-10",
            isIncoming ? "bg-gray-100" : "bg-white/20"
          )}>
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-sm opacity-70">Carregando vídeo...</span>
            </div>
          </div>
        )}

        {/* Video player */}
        <div className="relative">
          <video 
            ref={videoRef}
            controls 
            className={cn(
              "w-full rounded-lg shadow-sm max-w-sm",
              videoLoading && "opacity-0"
            )}
            style={{ maxHeight: '350px' }}
            preload="metadata"
            onLoadedMetadata={handleVideoLoad}
            onError={handleVideoError}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Cpath d='M35 25l30 20-30 20z' fill='%236b7280'/%3E%3C/svg%3E"
            key={`${messageId}-${retryCount}`}
          >
            <source src={url} type="video/mp4" />
            <source src={url} type="video/webm" />
            <source src={url} type="video/ogg" />
            Seu navegador não suporta reprodução de vídeo.
          </video>
          
          {/* Play button overlay */}
          {!isPlaying && !videoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all shadow-lg"
                  aria-label="Reproduzir"
                >
                  <PlayIcon className="w-8 h-8 text-gray-800 ml-1" />
                </button>
                <button
                  onClick={handleOpenFullscreen}
                  className="px-3 py-2 rounded-xl bg-white/80 hover:bg-white text-gray-800 shadow"
                  aria-label="Ampliar vídeo"
                >Ampliar</button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Caption removido - apenas vídeo sem descrição */}

      {/* Modal fullscreen semelhante ao de imagem, com scroll/zoom */}
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
            <div className="relative max-w-full max-h-full w-full h-full overflow-auto rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl">
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 120ms ease' }}>
                <video controls className="block mx-auto max-w-full" style={{ maxHeight: '80vh' }}>
                  <source src={url} type="video/mp4" />
                  <source src={url} type="video/webm" />
                  <source src={url} type="video/ogg" />
                </video>
              </div>
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button onClick={handleZoomOut} className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30" aria-label="Reduzir zoom">−</button>
              <button onClick={handleZoomIn} className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30" aria-label="Aumentar zoom">+</button>
              <button onClick={handleZoomReset} className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30" aria-label="Redefinir zoom">1×</button>
              <button onClick={() => setIsFullscreen(false)} className="px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-white border border-white/30" aria-label="Fechar">×</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

VideoMessage.displayName = 'VideoMessage';
