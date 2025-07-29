
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface MediaUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export const useMediaUpload = () => {
  const [state, setState] = useState<MediaUploadState>({
    isUploading: false,
    progress: 0,
    error: null
  });

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    setState(prev => ({ ...prev, isUploading: true, error: null, progress: 0 }));

    try {
      // Convert file to base64 DataURL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setState(prev => ({ ...prev, progress: 100, isUploading: false }));
      return dataUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      setState(prev => ({ 
        ...prev, 
        isUploading: false, 
        error: 'Erro ao processar arquivo' 
      }));
      toast.error('Erro ao processar arquivo');
      return null;
    }
  }, []);

  const resetState = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null
    });
  }, []);

  return {
    ...state,
    uploadFile,
    resetState
  };
};
