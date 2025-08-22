
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle } from 'lucide-react';

interface AudioRecorderProps {
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSend: (audioBlob: Blob) => Promise<void>;
  isRecording: boolean;
}

export const AudioRecorder = ({
  onStartRecording,
  onStopRecording,
  onSend,
  isRecording
}: AudioRecorderProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await onSend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      onStartRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      onStopRecording();
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={isRecording ? stopRecording : startRecording}
      className="h-8 w-8 p-0"
    >
      {isRecording ? (
        <StopCircle className="h-4 w-4 text-red-500" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};
