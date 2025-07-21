
import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface AudioMessageProps {
  messageId: string;
  url: string;
  isIncoming?: boolean;
  isLoading?: boolean;
}

export const AudioMessage = React.memo(({ 
  messageId, 
  url, 
  isIncoming, 
  isLoading = false 
}: AudioMessageProps) => {
  const [audioError, setAudioError] = useState(false);
  const [audioLoading, setAudioLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleAudioError = useCallback(() => {
    console.error('Erro ao carregar áudio:', url);
    setAudioError(true);
    setAudioLoading(false);
  }, [url]);

  const handleAudioLoad = useCallback(() => {
    setAudioLoading(false);
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Estado de erro
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
    <div className="flex items-center space-x-3 min-w-[200px] max-w-xs p-2 bg-gray-50 rounded-lg">
      {/* Play/Pause button */}
      <button
        onClick={handlePlayPause}
        disabled={audioLoading}
        className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors disabled:opacity-50"
      >
        {audioLoading ? (
          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
        ) : isPlaying ? (
          <Pause className="w-4 h-4 text-white" />
        ) : (
          <Play className="w-4 h-4 text-white ml-0.5" />
        )}
      </button>

      {/* Waveform placeholder e tempo */}
      <div className="flex-1 flex items-center space-x-2">
        {/* Waveform visual simples */}
        <div className="flex-1 h-8 flex items-center space-x-1">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 bg-gray-300 rounded-full transition-all duration-100",
                i < (currentTime / duration) * 15 ? "bg-blue-500" : "bg-gray-300"
              )}
              style={{ 
                height: `${Math.random() * 16 + 8}px`,
                opacity: audioLoading ? 0.5 : 1
              }}
            />
          ))}
        </div>

        {/* Tempo */}
        <span className="text-xs text-gray-600 font-mono min-w-[35px]">
          {audioLoading ? "0:00" : formatTime(currentTime)}
        </span>
      </div>

      {/* Audio element oculto */}
      <audio
        ref={audioRef}
        src={url}
        onLoadedMetadata={handleAudioLoad}
        onError={handleAudioError}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />
    </div>
  );
});

AudioMessage.displayName = 'AudioMessage';
