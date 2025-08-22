
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Paperclip, 
  Image, 
  File, 
  Video,
  X,
  Upload
} from 'lucide-react';

interface MediaUploaderProps {
  onMediaSelect: (file: File, type: 'image' | 'video' | 'document') => void;
  disabled?: boolean;
  maxFileSize?: number; // in MB
}

export const MediaUploader = ({ 
  onMediaSelect, 
  disabled = false,
  maxFileSize = 10 
}: MediaUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo ${maxFileSize}MB`);
      return;
    }

    // Determine file type
    let mediaType: 'image' | 'video' | 'document' = 'document';
    if (file.type.startsWith('image/')) {
      mediaType = 'image';
    } else if (file.type.startsWith('video/')) {
      mediaType = 'video';
    }

    // Simulate upload progress
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          onMediaSelect(file, mediaType);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={triggerFileSelect}
        disabled={disabled || isUploading}
        className="h-8 w-8 p-0"
      >
        {isUploading ? (
          <Upload className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>

      {isUploading && (
        <div className="absolute top-full left-0 mt-2 w-48 p-2 bg-white border rounded-lg shadow-lg z-10">
          <div className="text-xs text-gray-600 mb-1">Enviando arquivo...</div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
    </div>
  );
};
