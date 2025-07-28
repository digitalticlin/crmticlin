import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface MediaUploadHookProps {
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
}

export interface UploadedFile {
  file: File;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  size: number;
  name: string;
}

export const useMediaUpload = ({ onSendMessage }: MediaUploadHookProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Determinar tipo de mídia baseado no arquivo
  const getMediaType = useCallback((file: File): 'image' | 'video' | 'audio' | 'document' => {
    const type = file.type.toLowerCase();
    
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    return 'document';
  }, []);

  // Validar arquivo
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Tamanho máximo: 50MB
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'Arquivo muito grande. Máximo 50MB.' };
    }

    // Tipos permitidos
    const allowedTypes = [
      // Imagens
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      // Vídeos
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
      // Áudios
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac',
      // Documentos
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];

    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return { valid: false, error: 'Tipo de arquivo não suportado.' };
    }

    return { valid: true };
  }, []);

  // Converter arquivo para URL
  const convertFileToUrl = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result) {
          const result = reader.result as string;
          
          // ✅ DEBUG: Log específico para JPEG vs PNG
          if (process.env.NODE_ENV === 'development') {
            console.log('[MediaUpload] 📸 Arquivo convertido:', {
              name: file.name,
              type: file.type,
              size: `${(file.size / 1024).toFixed(1)}KB`,
              dataUrlPrefix: result.substring(0, 50) + '...',
              isJPEG: file.type.includes('jpeg'),
              isPNG: file.type.includes('png')
            });
          }
          
          resolve(result);
        } else {
          reject(new Error('Falha ao ler arquivo'));
        }
      };
      
      reader.onerror = () => {
        console.error('[MediaUpload] ❌ Erro ao processar arquivo:', file.name, file.type);
        reject(new Error('Erro ao processar arquivo'));
      };
      
      reader.readAsDataURL(file);
    });
  }, []);

  // Processar arquivo selecionado
  const processFile = useCallback(async (file: File): Promise<UploadedFile | null> => {
    console.log('[MediaUpload] 📎 Processando arquivo:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    });

    // Validar arquivo
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return null;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Converter para URL
      const url = await convertFileToUrl(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      const uploadedFile: UploadedFile = {
        file,
        url,
        type: getMediaType(file),
        size: file.size,
        name: file.name
      };

      console.log('[MediaUpload] ✅ Arquivo processado:', uploadedFile.type);
      return uploadedFile;

    } catch (error: any) {
      console.error('[MediaUpload] ❌ Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo');
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [validateFile, convertFileToUrl, getMediaType]);

  // Enviar arquivo processado
  const sendFile = useCallback(async (uploadedFile: UploadedFile, caption: string = ''): Promise<boolean> => {
    try {
      console.log('[MediaUpload] 📤 Enviando arquivo:', {
        type: uploadedFile.type,
        name: uploadedFile.name,
        hasCaption: !!caption.trim()
      });

      const message = caption.trim() || uploadedFile.name;
      const success = await onSendMessage(message, uploadedFile.type, uploadedFile.url);

      if (success) {
        toast.success(`${uploadedFile.type === 'image' ? 'Imagem' : 'Arquivo'} enviado com sucesso!`);
      }

      return success;

    } catch (error: any) {
      console.error('[MediaUpload] ❌ Erro ao enviar arquivo:', error);
      toast.error('Erro ao enviar arquivo');
      return false;
    }
  }, [onSendMessage]);

  // Upload e envio em uma etapa
  const uploadAndSend = useCallback(async (file: File, caption: string = ''): Promise<boolean> => {
    const uploadedFile = await processFile(file);
    if (!uploadedFile) return false;

    return await sendFile(uploadedFile, caption);
  }, [processFile, sendFile]);

  return {
    isUploading,
    uploadProgress,
    processFile,
    sendFile,
    uploadAndSend,
    validateFile,
    getMediaType
  };
}; 