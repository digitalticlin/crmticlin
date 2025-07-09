
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface VideoMessageProps {
  messageId: string;
  url: string;
  caption: string;
  isIncoming: boolean;
  isLoading?: boolean;
}

export const VideoMessage = ({ messageId, url, caption, isIncoming, isLoading = false }: VideoMessageProps) => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);

  const handleVideoError = () => {
    console.error('Erro ao carregar vídeo:', url);
    setVideoError(true);
    setVideoLoading(false);
  };

  const handleVideoLoad = () => {
    setVideoLoading(false);
  };

  if (videoError) {
    return (
      <div className="space-y-2">
        <div className={cn(
          "flex items-center justify-center p-4 rounded-lg border-2 border-dashed max-w-xs",
          isIncoming ? "border-gray-300 bg-gray-50" : "border-white/30 bg-white/10"
        )}>
          <span className="text-sm opacity-70">❌ Vídeo não disponível</span>
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
        {videoLoading && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center rounded-lg",
            isIncoming ? "bg-gray-100" : "bg-white/20"
          )}>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent"></div>
              <span className="text-sm opacity-70">Carregando vídeo...</span>
            </div>
          </div>
        )}
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
        >
          <source src={url} type="video/mp4" />
          <source src={url} type="video/webm" />
          <source src={url} type="video/ogg" />
          Seu navegador não suporta reprodução de vídeo.
        </video>
      </div>
      {caption && caption !== '[Vídeo]' && (
        <p className="break-words leading-relaxed whitespace-pre-wrap text-sm">{caption}</p>
      )}
    </div>
  );
};
