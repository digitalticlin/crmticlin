
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Play, Pause, Loader2, RefreshCw } from 'lucide-react';

interface AudioMessageProps {
  messageId: string;
  url: string;
  isIncoming?: boolean;
  isLoading?: boolean;
}

// 🎵 Função auxiliar para detectar MIME type do áudio pela extensão/URL
function getAudioMimeType(url: string): string {
  if (!url) return 'audio/mpeg';

  const urlLower = url.toLowerCase();

  if (urlLower.includes('.mp3') || urlLower.includes('mpeg')) return 'audio/mpeg';
  if (urlLower.includes('.ogg') || urlLower.includes('opus')) return 'audio/ogg; codecs=opus';
  if (urlLower.includes('.wav')) return 'audio/wav';
  if (urlLower.includes('.m4a') || urlLower.includes('.aac')) return 'audio/aac';
  if (urlLower.includes('.webm')) return 'audio/webm';

  // Default: assumir MP3 (mais compatível)
  return 'audio/mpeg';
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
  const [retryCount, setRetryCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Log de inicialização do componente
  useEffect(() => {
    console.group(`[AudioMessage] 🎵 INICIALIZANDO COMPONENTE`);
    console.log('═══════════════════════════════════════════');
    console.log('🆔 Message ID:', messageId);
    console.log('🔗 URL:', url);
    console.log('📥 Is Incoming:', isIncoming);
    console.log('⏳ Is Loading:', isLoading);
    console.log('✅ URL válida?', !!url);
    console.log('🔍 Tipo da URL:', typeof url);
    console.log('📏 Tamanho da URL:', url?.length || 0);
    console.log('═══════════════════════════════════════════');
    console.groupEnd();
  }, [messageId, url, isIncoming, isLoading]);

  const handleAudioError = useCallback((e?: Event) => {
    const audioElement = audioRef.current;
    console.group(`[AudioMessage] ❌ ERRO AO CARREGAR ÁUDIO`);
    console.error('═══════════════════════════════════════════');
    console.error('🆔 Message ID:', messageId);
    console.error('🔗 URL:', url);
    console.error('📊 Audio Element:', audioElement);
    console.error('⚠️ Error Event:', e);
    if (audioElement) {
      console.error('🔍 networkState:', audioElement.networkState);
      console.error('🔍 readyState:', audioElement.readyState);
      console.error('🔍 error:', audioElement.error);
      console.error('🔍 error.code:', audioElement.error?.code);
      console.error('🔍 error.message:', audioElement.error?.message);
      console.error('🔍 src:', audioElement.src);
      console.error('🔍 currentSrc:', audioElement.currentSrc);

      // 🆕 LOGS ESPECÍFICOS PARA SAFARI/iOS
      console.error('🍎 User Agent:', navigator.userAgent);
      console.error('🍎 É Safari?', /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent));
      console.error('🍎 É iOS?', /iPhone|iPad|iPod/.test(navigator.userAgent));
      console.error('🎵 MIME type detectado:', getAudioMimeType(url));

      // Traduzir error.code para mensagem legível
      const errorCodes = {
        1: 'MEDIA_ERR_ABORTED - Usuário cancelou',
        2: 'MEDIA_ERR_NETWORK - Erro de rede',
        3: 'MEDIA_ERR_DECODE - Erro ao decodificar',
        4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - Formato não suportado'
      };
      console.error('📝 Descrição do erro:', errorCodes[audioElement.error?.code || 0] || 'Erro desconhecido');
    }
    console.error('═══════════════════════════════════════════');
    console.groupEnd();
    setAudioError(true);
    setAudioLoading(false);
  }, [messageId, url]);

  const handleAudioLoad = useCallback(() => {
    console.group(`[AudioMessage] ✅ ÁUDIO CARREGADO COM SUCESSO`);
    console.log('═══════════════════════════════════════════');
    console.log('🆔 Message ID:', messageId);
    console.log('🔗 URL:', url);
    console.log('⏱️ Duration:', audioRef.current?.duration || 0, 'segundos');
    console.log('📊 Audio Element:', audioRef.current);
    console.log('═══════════════════════════════════════════');
    console.groupEnd();
    setAudioLoading(false);
    setAudioError(false);
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  }, [messageId, url]);

  const handleRetry = useCallback(() => {
    console.log(`[AudioMessage] 🔄 Tentando novamente: ${messageId} (tentativa ${retryCount + 1})`);
    setRetryCount(prev => prev + 1);
    setAudioError(false);
    setAudioLoading(true);
  }, [messageId, retryCount]);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center space-x-3 min-w-[250px] max-w-xs p-3 bg-gray-50 rounded-lg">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
        <div className="flex-1">
          <div className="h-1 bg-gray-200 rounded-full mb-2">
            <div className="h-full bg-gray-300 rounded-full animate-pulse w-2/3"></div>
          </div>
          <span className="text-xs text-gray-500">Carregando áudio...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (audioError || !url) {
    return (
      <div className="flex items-center space-x-3 min-w-[200px] p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <VolumeX className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <span className="text-sm text-gray-500 block">Áudio não disponível</span>
          {retryCount < 3 && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1 mt-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 min-w-[280px] max-w-xs p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Play/Pause button */}
      <button
        onClick={handlePlayPause}
        disabled={audioLoading}
        className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
      >
        {audioLoading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-5 h-5 text-white" />
        ) : (
          <Play className="w-5 h-5 text-white ml-0.5" />
        )}
      </button>

      {/* Waveform e controles */}
      <div className="flex-1 flex flex-col space-y-2">
        {/* Barra de progresso */}
        <div 
          className="h-8 flex items-center cursor-pointer"
          onClick={handleSeek}
        >
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-100 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tempo */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 font-mono">
            {formatTime(currentTime)}
          </span>
          {duration > 0 && (
            <span className="text-xs text-gray-400 font-mono">
              {formatTime(duration)}
            </span>
          )}
        </div>
      </div>

      {/* Audio element com suporte para múltiplos formatos (fallback Safari/iOS) */}
      <audio
        ref={audioRef}
        onLoadedMetadata={handleAudioLoad}
        onError={handleAudioError}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          setProgress(0);
        }}
        preload="metadata"
        key={`${messageId}-${retryCount}`}
      >
        {/* Tentar carregar o áudio original primeiro */}
        <source src={url} type={getAudioMimeType(url)} />

        {/* Fallback: Tentar forçar como MP3 se Safari não reconhecer OGG */}
        {url && (url.includes('.ogg') || url.includes('opus')) && (
          <source src={url} type="audio/mpeg" />
        )}

        {/* Mensagem para navegadores muito antigos sem suporte HTML5 */}
        Seu navegador não suporta áudio HTML5.
      </audio>
    </div>
  );
});

AudioMessage.displayName = 'AudioMessage';
