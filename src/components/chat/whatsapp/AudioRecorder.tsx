
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Mic, 
  MicOff, 
  Square,
  Play,
  Pause,
  Send,
  Trash2
} from 'lucide-react';

interface AudioRecorderProps {
  onAudioSend: (audioBlob: Blob) => void;
  disabled?: boolean;
}

export const AudioRecorder = ({ onAudioSend, disabled = false }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Erro ao iniciar gravação');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioBlob && !isPlaying) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const sendAudio = () => {
    if (audioBlob) {
      onAudioSend(audioBlob);
      resetRecorder();
    }
  };

  const resetRecorder = () => {
    setAudioBlob(null);
    setIsPlaying(false);
    setRecordingTime(0);
    if (audioRef.current) {
      audioRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioBlob) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={isPlaying ? pauseAudio : playAudio}
          className="h-8 w-8 p-0"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <span className="text-sm text-gray-600">
          {formatTime(recordingTime)}
        </span>
        
        <div className="flex gap-1 ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetRecorder}
            className="h-8 w-8 p-0 text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={sendAudio}
            className="h-8 w-8 p-0 text-green-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording && (
        <span className="text-sm text-red-600 font-mono">
          {formatTime(recordingTime)}
        </span>
      )}
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={`h-8 w-8 p-0 ${isRecording ? 'text-red-600' : 'text-gray-600'}`}
      >
        {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
    </div>
  );
};
