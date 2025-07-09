
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseMediaLoaderProps {
  messageId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
}

interface UseMediaLoaderReturn {
  finalUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useMediaLoader = ({ 
  messageId, 
  mediaType, 
  mediaUrl 
}: UseMediaLoaderProps): UseMediaLoaderReturn => {
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMedia = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Primeiro, verificar se há cache no banco
        const { data: cacheData } = await supabase
          .from('media_cache')
          .select('cached_url, base64_data')
          .eq('message_id', messageId)
          .maybeSingle();

        if (cacheData) {
          // Priorizar base64 se disponível
          if (cacheData.base64_data) {
            const mimeType = getMimeType(mediaType);
            setFinalUrl(`data:${mimeType};base64,${cacheData.base64_data}`);
            setIsLoading(false);
            return;
          }

          // Usar URL cached se disponível
          if (cacheData.cached_url) {
            setFinalUrl(cacheData.cached_url);
            setIsLoading(false);
            return;
          }
        }

        // 2. Se não há cache, usar URL original ou tentar buscar do storage
        if (mediaUrl) {
          // Verificar se é URL do Supabase Storage
          if (mediaUrl.includes('supabase.co/storage/v1/object/public/whatsapp-media/')) {
            setFinalUrl(mediaUrl);
          } else {
            // Tentar buscar no storage do Supabase por nome de arquivo
            const fileName = `${messageId}.${getFileExtension(mediaType)}`;
            const { data } = supabase.storage
              .from('whatsapp-media')
              .getPublicUrl(fileName);
            
            if (data.publicUrl) {
              setFinalUrl(data.publicUrl);
            } else {
              setFinalUrl(mediaUrl); // Fallback para URL original
            }
          }
        } else {
          setError('URL de mídia não encontrada');
        }
      } catch (err) {
        console.error('Erro ao carregar mídia:', err);
        setError('Erro ao carregar mídia');
        
        // Fallback para URL original se houver
        if (mediaUrl) {
          setFinalUrl(mediaUrl);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadMedia();
  }, [messageId, mediaUrl, mediaType]);

  return { finalUrl, isLoading, error };
};

// Função para determinar MIME type
const getMimeType = (type: string) => {
  switch (type) {
    case 'image': return 'image/jpeg';
    case 'video': return 'video/mp4';
    case 'audio': return 'audio/ogg';
    case 'document': return 'application/pdf';
    default: return 'application/octet-stream';
  }
};

// Função para extensão de arquivo
const getFileExtension = (type: string) => {
  switch (type) {
    case 'image': return 'jpg';
    case 'video': return 'mp4';
    case 'audio': return 'ogg';
    case 'document': return 'pdf';
    default: return 'bin';
  }
};
