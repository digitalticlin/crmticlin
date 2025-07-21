
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Play, Pause, Loader2 } from 'lucide-react';

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
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleAudioError = useCallback(() => {
    console.error(`[AudioMessage] ❌ Erro ao carregar áudio: ${messageId}`, url);
    setAudioError(true);
    setAudioLoading(false);
  }, [messageId, url]);

  const handleAudioLoad = useCallback(() => {
    console.log(`[AudioMessage] ✅ Áudio carregado: ${messageId}`);
    setAudioLoading(false);
    setAudioError(false);
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  }, [messageId]);

  const handlePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error(`[AudioMessage] ❌ Erro ao reproduzir áudio: ${messageId}`, error);
          setAudioError(true);
        });
      }
    }
  }, [isPlaying, messageId]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration || 0;
      setCurrentTime(current);
      setProgress(total > 0 ? (current / total) * 100 : 0);
    }
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress((newTime / duration) * 100);
    }
  }, [duration]);

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Estado de loading
  if (isLoading) {
    return (
      <div className="flex items-center space-x-3 min-w-[200px] max-w-xs p-3 bg-gray-50 rounded-lg">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        </div>
        <span className="text-sm text-gray-500">Carregando áudio...</span>
      </div>
    );
  }

  // Estado de erro
  if (audioError || !url) {
    return (
      <div className="flex items-center space-x-3 min-w-[180px] p-3 bg-gray-50 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <VolumeX className="w-4 h-4 text-gray-400" />
        </div>
        <span className="text-xs text-gray-500">Áudio indisponível</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 min-w-[220px] max-w-xs p-3 bg-gray-50 rounded-lg">
      {/* Play/Pause button */}
      <button
        onClick={handlePlayPause}
        disabled={audioLoading}
        className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {audioLoading ? (
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 text-white" />
        ) : (
          <Play className="w-4 h-4 text-white ml-0.5" />
        )}
      </button>

      {/* Waveform e controles */}
      <div className="flex-1 flex items-center space-x-2">
        {/* Barra de progresso */}
        <div 
          className="flex-1 h-8 flex items-center cursor-pointer"
          onClick={handleSeek}
        >
          <div className="w-full h-1 bg-gray-300 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tempo */}
        <span className="text-xs text-gray-600 font-mono min-w-[35px]">
          {formatTime(currentTime)}
        </span>
        
        {duration > 0 && (
          <>
            <span className="text-xs text-gray-400">/</span>
            <span className="text-xs text-gray-600 font-mono min-w-[35px]">
              {formatTime(duration)}
            </span>
          </>
        )}
      </div>

      {/* Audio element */}
      <audio
        ref={audioRef}
        src={url}
        onLoadedMetadata={handleAudioLoad}
        onError={handleAudioError}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        preload="metadata"
      />
    </div>
  );
});

AudioMessage.displayName = 'AudioMessage';
