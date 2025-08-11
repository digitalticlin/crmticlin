/**
 * 🎯 HOOK ISOLADO PARA MÍDIA WHATSAPP
 * 
 * RESPONSABILIDADES:
 * ✅ Upload de mídia isolado
 * ✅ Cache de mídia isolado
 * ✅ Download de mídia isolado
 * ✅ Processamento de mídia isolado
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  size: number;
  name: string;
  mimeType: string;
}

interface UseWhatsAppMediaReturn {
  isUploading: boolean;
  isDownloading: boolean;
  uploadProgress: number;
  uploadMedia: (file: File) => Promise<MediaFile | null>;
  downloadMedia: (url: string) => Promise<Blob | null>;
  deleteMedia: (mediaId: string) => Promise<boolean>;
  getMediaPreview: (url: string) => Promise<string | null>;
  validateMediaFile: (file: File) => { isValid: boolean; error?: string };
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
};

export const useWhatsAppMedia = (): UseWhatsAppMediaReturn => {
  // Estados isolados da feature
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Cache isolado de mídia
  const mediaCache = useRef<Map<string, Blob>>(new Map());
  const previewCache = useRef<Map<string, string>>(new Map());

  // Validar arquivo de mídia
  const validateMediaFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Verificar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return { isValid: false, error: 'Arquivo muito grande. Máximo permitido: 50MB' };
    }

    // Verificar tipo
    const fileType = getFileType(file.type);
    if (!fileType) {
      return { isValid: false, error: 'Tipo de arquivo não suportado' };
    }

    const allowedMimeTypes = ALLOWED_TYPES[fileType];
    if (!allowedMimeTypes.includes(file.type)) {
      return { isValid: false, error: `Tipo ${file.type} não é suportado para ${fileType}` };
    }

    return { isValid: true };
  }, []);

  // Helper para determinar tipo de arquivo
  const getFileType = useCallback((mimeType: string): keyof typeof ALLOWED_TYPES | null => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'document';
    return null;
  }, []);

  // Upload de mídia isolado
  const uploadMedia = useCallback(async (file: File): Promise<MediaFile | null> => {
    const validation = validateMediaFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `whatsapp-media/${fileName}`;

      console.log('[WhatsApp Media] 📤 Fazendo upload:', {
        fileName,
        size: file.size,
        type: file.type
      });

      // Simular progresso (Supabase não tem progresso real)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const mediaFile: MediaFile = {
        id: data.path,
        url: publicUrlData.publicUrl,
        type: getFileType(file.type)!,
        size: file.size,
        name: file.name,
        mimeType: file.type
      };

      console.log('[WhatsApp Media] ✅ Upload concluído:', mediaFile.id);
      toast.success('Mídia enviada com sucesso!');

      return mediaFile;

    } catch (error: any) {
      console.error('[WhatsApp Media] ❌ Erro no upload:', error);
      toast.error(`Erro no upload: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [validateMediaFile, getFileType]);

  // Download de mídia isolado
  const downloadMedia = useCallback(async (url: string): Promise<Blob | null> => {
    // Verificar cache primeiro
    if (mediaCache.current.has(url)) {
      console.log('[WhatsApp Media] 💾 Usando cache para download:', url);
      return mediaCache.current.get(url)!;
    }

    setIsDownloading(true);

    try {
      console.log('[WhatsApp Media] 📥 Fazendo download:', url);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const blob = await response.blob();
      
      // Salvar no cache
      mediaCache.current.set(url, blob);
      
      console.log('[WhatsApp Media] ✅ Download concluído e cacheado');
      return blob;

    } catch (error: any) {
      console.error('[WhatsApp Media] ❌ Erro no download:', error);
      toast.error(`Erro no download: ${error.message}`);
      return null;
    } finally {
      setIsDownloading(false);
    }
  }, []);

  // Deletar mídia isolado
  const deleteMedia = useCallback(async (mediaId: string): Promise<boolean> => {
    try {
      console.log('[WhatsApp Media] 🗑️ Deletando mídia:', mediaId);

      const { error } = await supabase.storage
        .from('media')
        .remove([mediaId]);

      if (error) throw error;

      // Limpar cache
      const urlsToRemove = Array.from(mediaCache.current.keys()).filter(url => 
        url.includes(mediaId)
      );
      urlsToRemove.forEach(url => {
        mediaCache.current.delete(url);
        previewCache.current.delete(url);
      });

      console.log('[WhatsApp Media] ✅ Mídia deletada com sucesso');
      toast.success('Mídia removida com sucesso!');
      return true;

    } catch (error: any) {
      console.error('[WhatsApp Media] ❌ Erro ao deletar mídia:', error);
      toast.error(`Erro ao deletar: ${error.message}`);
      return false;
    }
  }, []);

  // Obter preview de mídia
  const getMediaPreview = useCallback(async (url: string): Promise<string | null> => {
    // Verificar cache de preview
    if (previewCache.current.has(url)) {
      return previewCache.current.get(url)!;
    }

    try {
      const blob = await downloadMedia(url);
      if (!blob) return null;

      const previewUrl = URL.createObjectURL(blob);
      previewCache.current.set(url, previewUrl);
      
      return previewUrl;
    } catch (error) {
      console.error('[WhatsApp Media] ❌ Erro ao gerar preview:', error);
      return null;
    }
  }, [downloadMedia]);

  return {
    isUploading,
    isDownloading,
    uploadProgress,
    uploadMedia,
    downloadMedia,
    deleteMedia,
    getMediaPreview,
    validateMediaFile
  };
};