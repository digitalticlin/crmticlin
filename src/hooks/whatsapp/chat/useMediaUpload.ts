
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

  // ✅ PROCESSAMENTO OTIMIZADO DE ARQUIVO
  const processFile = useCallback(async (file: File): Promise<UploadedFile | null> => {
    setState(prev => ({ ...prev, isUploading: true, error: null, uploadProgress: 0 }));

    try {
      // ✅ VALIDAÇÃO DE TAMANHO (50MB MAX)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Máximo 50MB permitido.');
      }

      // ✅ PROGRESSO SIMULADO PARA FEEDBACK
      setState(prev => ({ ...prev, uploadProgress: 25 }));

      // ✅ CONVERSÃO PARA BASE64 DATA URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = 25 + (event.loaded / event.total) * 50; // 25-75%
            setState(prev => ({ ...prev, uploadProgress: Math.round(progress) }));
          }
        };
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
      });

      setState(prev => ({ ...prev, uploadProgress: 90 }));

      // ✅ DETERMINAR TIPO DE MÍDIA
      let mediaType = 'document';
      if (file.type.startsWith('image/')) mediaType = 'image';
      else if (file.type.startsWith('video/')) mediaType = 'video';
      else if (file.type.startsWith('audio/')) mediaType = 'audio';

      setState(prev => ({ ...prev, uploadProgress: 100, isUploading: false }));
      
      console.log('[useMediaUpload] ✅ Arquivo processado:', {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + 'KB',
        type: mediaType,
        dataUrlLength: dataUrl.length
      });

      return {
        name: file.name,
        size: file.size,
        type: mediaType,
        url: dataUrl
      };

    } catch (error: any) {
      console.error('[useMediaUpload] ❌ Erro ao processar arquivo:', error);
      setState(prev => ({ 
        ...prev, 
        isUploading: false, 
        error: error.message || 'Erro ao processar arquivo' 
      }));
      toast.error(error.message || 'Erro ao processar arquivo');
      return null;
    }
  }, []);

  // ✅ ENVIO OTIMIZADO COM FEEDBACK MELHORADO
  const sendFile = useCallback(async (file: UploadedFile, caption: string): Promise<boolean> => {
    if (!options?.onSendMessage) {
      console.error('[useMediaUpload] onSendMessage não fornecido');
      toast.error('Configuração de envio inválida');
      return false;
    }

    try {
      console.log('[useMediaUpload] 📤 Iniciando envio de mídia:', {
        name: file.name,
        type: file.type,
        size: (file.size / 1024).toFixed(1) + 'KB',
        captionLength: caption.length
      });

      // ✅ USAR CAPTION COMO TEXTO DA MENSAGEM
      const messageText = caption.trim() || file.name;
      
      const success = await options.onSendMessage(messageText, file.type, file.url);
      
      if (success) {
        console.log('[useMediaUpload] ✅ Mídia enviada com sucesso');
        toast.success(`${file.type === 'image' ? 'Foto' : 
                        file.type === 'video' ? 'Vídeo' : 
                        file.type === 'audio' ? 'Áudio' : 'Arquivo'} enviado com sucesso`);
      } else {
        console.error('[useMediaUpload] ❌ Falha no envio de mídia');
        toast.error('Erro ao enviar mídia');
      }
      
      return success;

    } catch (error: any) {
      console.error('[useMediaUpload] ❌ Erro crítico no envio:', error);
      toast.error('Erro ao enviar mídia');
      return false;
    }
  }, [options]);

  // ✅ UPLOAD SIMPLIFICADO PARA USO DIRETO
  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const processedFile = await processFile(file);
    return processedFile?.url || null;
  }, [processFile]);

  // ✅ RESET OTIMIZADO
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
