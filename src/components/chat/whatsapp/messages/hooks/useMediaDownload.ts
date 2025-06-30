import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseMediaDownloadProps {
  url: string;
  filename?: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
}

export const useMediaDownload = ({ url, filename, mediaType }: UseMediaDownloadProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadMedia = useCallback(async () => {
    if (!url) {
      toast.error('URL do arquivo não disponível');
      return;
    }

    setIsDownloading(true);
    
    try {
      // Abrir em nova aba para download
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      
      if (filename) {
        link.download = filename;
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download iniciado');
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toast.error('Erro ao fazer download do arquivo');
    } finally {
      setIsDownloading(false);
    }
  }, [url, filename]);

  const openMedia = useCallback(() => {
    if (!url) {
      toast.error('URL do arquivo não disponível');
      return;
    }

    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Erro ao abrir mídia:', error);
      toast.error('Erro ao abrir o arquivo');
    }
  }, [url]);

  const copyUrl = useCallback(async () => {
    if (!url) {
      toast.error('URL não disponível');
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copiada para a área de transferência');
    } catch (error) {
      console.error('Erro ao copiar URL:', error);
      toast.error('Erro ao copiar URL');
    }
  }, [url]);

  return {
    downloadMedia,
    openMedia,
    copyUrl,
    isDownloading
  };
}; 