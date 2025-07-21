
import React, { useState, useRef } from 'react';
import { Play, Pause, Download, FileText, Image as ImageIcon, Video, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MessageMediaProps {
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'text';
  fileName?: string;
  className?: string;
}

export const MessageMedia: React.FC<MessageMediaProps> = ({
  mediaUrl,
  mediaType,
  fileName,
  className
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleAudioToggle = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoToggle = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
    }
  };

  const handleError = () => {
    setLoadError(true);
  };

  if (loadError) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 bg-gray-100 rounded-lg border border-gray-200",
        className
      )}>
        <FileText className="h-5 w-5 text-gray-500" />
        <span className="text-sm text-gray-600">Erro ao carregar mídia</span>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleDownload}
          className="ml-auto"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  switch (mediaType) {
    case 'image':
      return (
        <div className={cn("relative group", className)}>
          <img
            src={mediaUrl}
            alt="Imagem enviada"
            className="max-w-sm max-h-64 rounded-lg object-cover cursor-pointer"
            onError={handleError}
            onClick={() => window.open(mediaUrl, '_blank')}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ImageIcon className="h-6 w-6 text-white" />
          </div>
        </div>
      );

    case 'video':
      return (
        <div className={cn("relative", className)}>
          <video
            ref={videoRef}
            src={mediaUrl}
            className="max-w-sm max-h-64 rounded-lg"
            controls
            onError={handleError}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center pointer-events-none">
            {!isPlaying && <Video className="h-8 w-8 text-white" />}
          </div>
        </div>
      );

    case 'audio':
      return (
        <div className={cn(
          "flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 min-w-[200px]",
          className
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAudioToggle}
            className="h-8 w-8 p-0"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Áudio</span>
            </div>
            <audio
              ref={audioRef}
              src={mediaUrl}
              onError={handleError}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );

    case 'document':
      return (
        <div className={cn(
          "flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 min-w-[200px]",
          className
        )}>
          <FileText className="h-5 w-5 text-gray-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {fileName || 'Documento'}
            </p>
            <p className="text-xs text-gray-500">Clique para baixar</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );

    default:
      return null;
  }
};
