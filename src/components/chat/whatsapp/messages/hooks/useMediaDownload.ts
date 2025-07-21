
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseMediaDownloadProps {
  url: string;
  filename: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
}

export const useMediaDownload = ({ url, filename, mediaType }: UseMediaDownloadProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const openMedia = useCallback(async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    
    try {
      // Para documentos e mídias, tentar download direto
      if (mediaType === 'document' || mediaType === 'audio') {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Para imagens e vídeos, abrir em nova aba
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Erro ao abrir mídia:', error);
      toast.error('Erro ao abrir arquivo');
    } finally {
      setIsDownloading(false);
    }
  }, [url, filename, mediaType, isDownloading]);

  return {
    openMedia,
    isDownloading
  };
};
