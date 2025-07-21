
import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { PlayIcon, VideoIcon } from 'lucide-react';

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

  const handleVideoError = useCallback(() => {
    console.error('Erro ao carregar vídeo:', url);
    setVideoError(true);
    setVideoLoading(false);
  }, [url]);

  const handleVideoLoad = useCallback(() => {
    setVideoLoading(false);
  }, []);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Estado de erro
  if (videoError) {
    return (
      <div className="space-y-2">
        <div className={cn(
          "flex items-center justify-center p-4 rounded-lg border-2 border-dashed max-w-xs",
          isIncoming ? "border-gray-300 bg-gray-50" : "border-white/30 bg-white/10"
        )}>
          <div className="text-center">
            <VideoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="text-sm opacity-70">Vídeo não disponível</span>
          </div>
        </div>
        {caption && caption !== '[Vídeo]' && (
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
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent"></div>
              <span className="text-sm opacity-70">Carregando vídeo...</span>
            </div>
          </div>
        )}

        {/* Video player */}
        <div className="relative">
          <video 
            controls 
            className={cn(
              "w-full rounded-lg shadow-sm max-w-xs",
              videoLoading && "opacity-0"
            )}
            style={{ maxHeight: '300px' }}
            preload="metadata"
            onLoadedMetadata={handleVideoLoad}
            onError={handleVideoError}
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Cpath d='M40 30l20 15-20 15z' fill='%236b7280'/%3E%3C/svg%3E"
          >
            <source src={url} type="video/mp4" />
            <source src={url} type="video/webm" />
            <source src={url} type="video/ogg" />
            Seu navegador não suporta reprodução de vídeo.
          </video>
          
          {/* Play button overlay (when paused) */}
          {!isPlaying && !videoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
              <button
                onClick={handlePlayPause}
                className="w-12 h-12 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
              >
                <PlayIcon className="w-6 h-6 text-gray-800 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Caption */}
      {caption && caption !== '[Vídeo]' && (
        <p className="break-words leading-relaxed whitespace-pre-wrap text-sm">{caption}</p>
      )}
    </div>
  );
});

VideoMessage.displayName = 'VideoMessage';
