
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, Image, Video, Mic, X } from 'lucide-react';
import { toast } from 'sonner';

interface MediaUploaderProps {
  onMediaSelect: (file: File | null, type: 'text' | 'image' | 'video' | 'audio' | 'document') => void;
  selectedFile?: File | null;
  mediaType: 'text' | 'image' | 'video' | 'audio' | 'document';
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onMediaSelect,
  selectedFile,
  mediaType
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 16MB)
      if (file.size > 16 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 16MB.');
        return;
      }
      
      onMediaSelect(file, getFileType(file));
    }
  };

  const getFileType = (file: File): 'image' | 'video' | 'audio' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const getIcon = () => {
    switch (mediaType) {
      case 'image':
        return <Image className="w-8 h-8" />;
      case 'video':
        return <Video className="w-8 h-8" />;
      case 'audio':
        return <Mic className="w-8 h-8" />;
      case 'document':
        return <File className="w-8 h-8" />;
      default:
        return <Upload className="w-8 h-8" />;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 16 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 16MB.');
        return;
      }
      onMediaSelect(file, getFileType(file));
    }
  };

  const removeFile = () => {
    onMediaSelect(null, 'text');
  };

  if (selectedFile) {
    return (
      <Card className="border-2 border-dashed border-green-300 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getIcon()}
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('media-upload')?.click()}
      >
        <div className="flex flex-col items-center gap-2">
          {getIcon()}
          <p className="text-sm font-medium">
            Clique ou arraste um arquivo aqui
          </p>
          <p className="text-xs text-gray-500">
            Máximo 16MB • Imagens, vídeos, áudios e documentos
          </p>
        </div>
        
        <Input
          id="media-upload"
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </div>
  );
};
