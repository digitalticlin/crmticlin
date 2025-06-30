import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioMessageProps {
  messageId: string;
  url: string;
  isIncoming?: boolean;
  isLoading?: boolean;
}

export const AudioMessage = React.memo(({ messageId, url, isIncoming, isLoading: cacheLoading = false }: AudioMessageProps) => {
  const [audioError, setAudioError] = useState(false);
  const [audioLoading, setAudioLoading] = useState(true);

  const handleAudioError = useCallback(() => {
    setAudioError(true);
    setAudioLoading(false);
  }, []);

  const handleAudioLoad = useCallback(() => {
    setAudioLoading(false);
  }, []);

  // Mostrar loader enquanto está processando cache
  if (cacheLoading) {
    return (
      <div className="flex items-center space-x-2 min-w-[180px] p-2 bg-gray-50 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <div className="animate-pulse w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
        <span className="text-xs text-gray-500">Carregando áudio...</span>
      </div>
    );
  }

  if (audioError) {
    return (
      <div className="flex items-center space-x-2 min-w-[180px] p-2 bg-gray-50 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <VolumeX className="w-4 h-4 text-gray-400" />
        </div>
        <span className="text-xs text-gray-500">Áudio indisponível</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 min-w-[180px] max-w-xs">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
        {audioLoading ? (
          <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
        ) : (
          <Volume2 className="w-4 h-4 text-blue-600" />
        )}
      </div>
      <div className="flex-1">
        <audio 
          controls 
          className="w-full h-6 text-xs"
          style={{ minWidth: '140px' }}
          preload="metadata"
          onLoadedMetadata={handleAudioLoad}
          onError={handleAudioError}
        >
          <source src={url} type="audio/ogg" />
          <source src={url} type="audio/mpeg" />
          <source src={url} type="audio/mp3" />
          <source src={url} type="audio/wav" />
          Seu navegador não suporta reprodução de áudio.
        </audio>
      </div>
    </div>
  );
});

AudioMessage.displayName = 'AudioMessage'; 