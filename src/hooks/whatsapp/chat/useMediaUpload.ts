
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string;
}

interface MediaUploadState {
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

interface UseMediaUploadOptions {
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
}

export const useMediaUpload = (options?: UseMediaUploadOptions) => {
  const [state, setState] = useState<MediaUploadState>({
    isUploading: false,
    uploadProgress: 0,
    error: null
  });

  const processFile = useCallback(async (file: File): Promise<UploadedFile | null> => {
    setState(prev => ({ ...prev, isUploading: true, error: null, uploadProgress: 0 }));

    try {
      // Convert file to base64 DataURL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setState(prev => ({ ...prev, uploadProgress: 100, isUploading: false }));
      
      // Determine media type
      let mediaType = 'document';
      if (file.type.startsWith('image/')) mediaType = 'image';
      else if (file.type.startsWith('video/')) mediaType = 'video';
      else if (file.type.startsWith('audio/')) mediaType = 'audio';

      return {
        name: file.name,
        size: file.size,
        type: mediaType,
        url: dataUrl
      };
    } catch (error) {
      console.error('Error processing file:', error);
      setState(prev => ({ 
        ...prev, 
        isUploading: false, 
        error: 'Erro ao processar arquivo' 
      }));
      toast.error('Erro ao processar arquivo');
      return null;
    }
  }, []);

  const sendFile = useCallback(async (file: UploadedFile, caption: string): Promise<boolean> => {
    if (!options?.onSendMessage) {
      console.error('onSendMessage not provided');
      return false;
    }

    try {
      return await options.onSendMessage(caption, file.type, file.url);
    } catch (error) {
      console.error('Error sending file:', error);
      return false;
    }
  }, [options]);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const processedFile = await processFile(file);
    return processedFile?.url || null;
  }, [processFile]);

  const resetState = useCallback(() => {
    setState({
      isUploading: false,
      uploadProgress: 0,
      error: null
    });
  }, []);

  return {
    ...state,
    uploadFile,
    processFile,
    sendFile,
    resetState
  };
};
