
import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { PlayIcon, VideoIcon, Loader2, RefreshCw } from 'lucide-react';

interface VideoMessageProps {
  messageId: string;
  url: string;
  caption: string;
  isIncoming: boolean;
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

  const handleVideoError = useCallback(() => {
    console.error(`[VideoMessage] ❌ Erro ao carregar vídeo: ${messageId}`, {
      url: url?.substring(0, 50) + '...',
      isBase64: url?.startsWith('data:'),
      retryCount
    });
    setVideoError(true);
    setVideoLoading(false);
  }, [messageId, url, retryCount]);

  const handleVideoLoad = useCallback(() => {
    console.log(`[VideoMessage] ✅ Vídeo carregado: ${messageId}`);
    setVideoLoading(false);
    setVideoError(false);
    setRetryCount(0);
  }, [messageId]);

  const handleRetry = useCallback(() => {
    console.log(`[VideoMessage] 🔄 Tentando novamente: ${messageId} (tentativa ${retryCount + 1})`);
    setRetryCount(prev => prev + 1);
    setVideoError(false);
    setVideoLoading(true);
  }, [messageId, retryCount]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  // Estado de loading
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="w-64 h-36 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">Carregando vídeo...</span>
          </div>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (videoError || !url) {
    return (
      <div className="space-y-2">
        <div className={cn(
          "flex items-center justify-center p-4 rounded-lg border-2 border-dashed max-w-xs",
          isIncoming ? "border-gray-300 bg-gray-50" : "border-white/30 bg-white/10"
        )}>
          <div className="text-center">
            <VideoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="text-sm opacity-70 block mb-2">Vídeo não disponível</span>
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
        {caption && caption !== '[Vídeo]' && caption !== '[Mensagem não suportada]' && (
          <p className="break-words leading-relaxed whitespace-pre-wrap text-sm">{caption}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative max-w-xs">
        {/* Loading state */}
        {videoLoading && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center rounded-lg z-10",
            isIncoming ? "bg-gray-100" : "bg-white/20"
          )}>
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
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
              "w-full rounded-lg shadow-sm max-w-xs",
              videoLoading && "opacity-0"
            )}
            style={{ maxHeight: '300px' }}
            preload="metadata"
            onLoadedMetadata={handleVideoLoad}
            onError={handleVideoError}
            onPlay={handlePlay}
            onPause={handlePause}
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Cpath d='M40 30l20 15-20 15z' fill='%236b7280'/%3E%3C/svg%3E"
            key={`${messageId}-${retryCount}`} // Force re-render on retry
          >
            <source src={url} type="video/mp4" />
            <source src={url} type="video/webm" />
            <source src={url} type="video/ogg" />
            Seu navegador não suporta reprodução de vídeo.
          </video>
          
          {/* Play button overlay (quando pausado) */}
          {!isPlaying && !videoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
              <button
                onClick={handlePlayPause}
                className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all shadow-lg"
              >
                <PlayIcon className="w-6 h-6 text-gray-800 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Caption */}
      {caption && caption !== '[Vídeo]' && caption !== '[Mensagem não suportada]' && (
        <p className="break-words leading-relaxed whitespace-pre-wrap text-sm">{caption}</p>
      )}
    </div>
  );
});

VideoMessage.displayName = 'VideoMessage';
