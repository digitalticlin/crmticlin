
import React, { memo, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { FileText, Download, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageMediaProps {
  mediaType?: string;
  mediaUrl?: string;
  mediaCache?: any;
  fileName?: string;
  isIncoming?: boolean;
}

export const MessageMedia = memo(({ 
  mediaType, 
  mediaUrl, 
  mediaCache, 
  fileName,
  isIncoming = false 
}: MessageMediaProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Determinar URL de mídia com fallback otimizado
  const mediaDisplayUrl = useMemo(() => {
    if (mediaCache?.base64_data) {
      return `data:${mediaType};base64,${mediaCache.base64_data}`;
    }
    return mediaUrl;
  }, [mediaCache?.base64_data, mediaType, mediaUrl]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleDownload = () => {
    if (mediaDisplayUrl) {
      const link = document.createElement('a');
      link.href = mediaDisplayUrl;
      link.download = fileName || 'media';
      link.click();
    }
  };

  const toggleAudio = () => {
    setIsPlaying(!isPlaying);
  };

  // Renderizar diferentes tipos de mídia
  const renderMedia = () => {
    if (!mediaDisplayUrl) {
      return (
        <div className="flex items-center justify-center w-48 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <FileText className="w-8 h-8 text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Mídia não disponível</span>
        </div>
      );
    }

    switch (mediaType) {
      case 'image':
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
      case 'image/webp':
        return (
          <div className="relative">
            {!imageLoaded && !imageError && (
              <div className="flex items-center justify-center w-48 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
              </div>
            )}
            
            {!imageError && (
              <img
                src={mediaDisplayUrl}
                alt="Imagem"
                className={cn(
                  "max-w-xs max-h-64 rounded-lg object-cover cursor-pointer transition-opacity",
                  !imageLoaded && "opacity-0 absolute"
                )}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
            )}
            
            {imageError && (
              <div className="flex items-center justify-center w-48 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <FileText className="w-8 h-8 text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Erro ao carregar imagem</span>
              </div>
            )}
          </div>
        );

      case 'audio':
      case 'audio/mpeg':
      case 'audio/ogg':
      case 'audio/wav':
        return (
          <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg min-w-[200px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              className="h-8 w-8"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <Volume2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {fileName || 'Áudio'}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );

      case 'video':
      case 'video/mp4':
      case 'video/webm':
        return (
          <div className="relative">
            <video
              src={mediaDisplayUrl}
              className="max-w-xs max-h-64 rounded-lg"
              controls
              preload="metadata"
            >
              Seu navegador não suporta reprodução de vídeo.
            </video>
          </div>
        );

      case 'document':
      case 'application/pdf':
      default:
        return (
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg min-w-[200px]">
            <FileText className="h-6 w-6 text-blue-500" />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {fileName || 'Documento'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="mb-2">
      {renderMedia()}
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparação otimizada para evitar re-renders desnecessários
  return (
    prevProps.mediaType === nextProps.mediaType &&
    prevProps.mediaUrl === nextProps.mediaUrl &&
    prevProps.mediaCache?.base64_data === nextProps.mediaCache?.base64_data &&
    prevProps.fileName === nextProps.fileName &&
    prevProps.isIncoming === nextProps.isIncoming
  );
});

MessageMedia.displayName = 'MessageMedia';
