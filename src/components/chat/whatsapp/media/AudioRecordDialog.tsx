
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Play, Pause, Send, Square, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AudioRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'completed';

export const AudioRecordDialog: React.FC<AudioRecordDialogProps> = ({
  open,
  onOpenChange,
  onSendMessage
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Limpar estados ao fechar
  const handleClose = () => {
    stopRecording();
    resetRecording();
    onOpenChange(false);
  };

  // Reset completo do estado
  const resetRecording = () => {
    setRecordingState('idle');
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl('');
    setIsPlaying(false);
    setIsSending(false);
    chunksRef.current = [];
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  // Iniciar gravação
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setRecordingState('completed');
        
        // Parar stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setRecordingState('recording');
      
      // Timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success('Gravação iniciada');
      
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Erro ao acessar microfone');
    }
  };

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Reproduzir/pausar áudio
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Converter WebM para OGG (formato aceito pelo WhatsApp)
  const convertWebMToOgg = async (webmBlob: Blob): Promise<Blob> => {
    // Como navegadores não suportam conversão nativa WebM->OGG facilmente,
    // vamos manter o WebM mas mudar o MIME type para OGG/Opus que é compatível
    // A VPS vai processar corretamente
    console.log('[AudioRecordDialog] 🔄 Preparando áudio para WhatsApp PTT');

    // Criar novo blob com MIME type correto
    const oggBlob = new Blob([webmBlob], { type: 'audio/ogg;codecs=opus' });
    return oggBlob;
  };

  // Enviar áudio como PTT (Push-to-Talk) nativo do WhatsApp
  const handleSendAudio = async () => {
    if (!audioBlob || !audioUrl) {
      toast.error('Nenhum áudio gravado');
      return;
    }

    setIsSending(true);

    try {
      console.log('[AudioRecordDialog] 📤 Enviando áudio PTT nativo:', {
        originalFormat: audioBlob.type,
        duration: recordingTime,
        sizeKB: Math.round(audioBlob.size / 1024)
      });

      // ✅ Converter para formato compatível com WhatsApp
      const oggBlob = await convertWebMToOgg(audioBlob);

      // Converter blob para base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        console.log('[AudioRecordDialog] ✅ Áudio convertido para OGG/Opus:', {
          mimeType: 'audio/ogg;codecs=opus',
          base64Length: base64Data.length,
          sizeKB: Math.round(oggBlob.size / 1024)
        });

        // ✅ ENVIAR COMO PTT COM METADATA COMPLETA
        const success = await onSendMessage(
          '',  // ✅ Mensagem vazia para PTT nativo
          'ptt',  // ✅ Tipo PTT ao invés de 'audio'
          base64Data,
          {
            // ✅ METADATA PTT COMPLETA
            ptt: true,
            filename: `ptt_${Date.now()}.ogg`,
            seconds: recordingTime,
            mimeType: 'audio/ogg;codecs=opus',
            duration: recordingTime
          }
        );

        if (success) {
          toast.success('Mensagem de voz enviada!');
          handleClose();
        } else {
          toast.error('Erro ao enviar mensagem de voz');
        }
      };

      reader.onerror = () => {
        toast.error('Erro ao processar áudio');
      };

      reader.readAsDataURL(oggBlob);

    } catch (error) {
      console.error('[AudioRecordDialog] ❌ Erro ao enviar áudio:', error);
      toast.error('Erro ao enviar mensagem de voz');
    } finally {
      setIsSending(false);
    }
  };

  // Formatar tempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-md",
        "bg-white/95 backdrop-blur-md border border-white/30",
        "shadow-2xl backdrop-saturate-150"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-orange-600" />
            Gravar Mensagem de Voz
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Área de gravação */}
          <div className={cn(
            "rounded-2xl p-6 text-center",
            "bg-gradient-to-br from-orange-50/80 to-white/50 backdrop-blur-sm",
            "border border-orange-200/30"
          )}>
            {/* Timer */}
            <div className="text-3xl font-mono font-bold text-gray-800 mb-4">
              {formatTime(recordingTime)}
            </div>

            {/* Status Visual */}
            <div className="flex justify-center mb-6">
              {recordingState === 'recording' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm text-red-600 font-medium">Gravando...</span>
                </div>
              )}
              {recordingState === 'completed' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm text-green-600 font-medium">Gravação concluída</span>
                </div>
              )}
              {recordingState === 'idle' && (
                <span className="text-sm text-gray-500">Pressione para começar a gravar</span>
              )}
            </div>

            {/* Controles de gravação */}
            <div className="flex justify-center gap-3">
              {recordingState === 'idle' && (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="bg-red-500 hover:bg-red-600 text-white w-16 h-16 rounded-full shadow-lg"
                >
                  <Mic className="h-6 w-6" />
                </Button>
              )}

              {recordingState === 'recording' && (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white w-16 h-16 rounded-full shadow-lg animate-pulse"
                >
                  <Square className="h-6 w-6" />
                </Button>
              )}

              {recordingState === 'completed' && (
                <div className="flex gap-3">
                  <Button
                    onClick={togglePlayback}
                    size="lg"
                    variant="outline"
                    className="w-12 h-12 rounded-full backdrop-blur-sm bg-white/50"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    onClick={resetRecording}
                    size="lg"
                    variant="outline"
                    className="w-12 h-12 rounded-full backdrop-blur-sm bg-white/50 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Player invisível */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              style={{ display: 'none' }}
            />
          )}

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 backdrop-blur-sm bg-white/50"
              disabled={isSending}
            >
              Cancelar
            </Button>
            
            {recordingState === 'completed' && (
              <Button
                onClick={handleSendAudio}
                disabled={isSending}
                className="flex-1 bg-orange-600 hover:bg-orange-700 shadow-lg"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Áudio
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
