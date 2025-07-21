
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
      console.log(`[MediaLoader] 🔍 Iniciando carregamento para ${messageId} (${mediaType})`);
      setIsLoading(true);
      setError(null);

      try {
        // PRIORIDADE 1: Verificar cache no banco (base64 ou URL cached)
        const { data: cacheData, error: cacheError } = await supabase
          .from('media_cache')
          .select('cached_url, base64_data, file_name')
          .eq('message_id', messageId)
          .maybeSingle();

        if (cacheError) {
          console.warn(`[MediaLoader] ⚠️ Erro ao buscar cache: ${cacheError.message}`);
        }

        if (cacheData) {
          console.log(`[MediaLoader] 📦 Cache encontrado para ${messageId}:`, {
            hasCachedUrl: !!cacheData.cached_url,
            hasBase64: !!cacheData.base64_data,
            fileName: cacheData.file_name
          });

          // PRIORIDADE 1A: Base64 data (melhor performance)
          if (cacheData.base64_data) {
            const mimeType = getMimeType(mediaType);
            const dataUrl = `data:${mimeType};base64,${cacheData.base64_data}`;
            console.log(`[MediaLoader] ✅ Usando base64 para ${messageId}`);
            setFinalUrl(dataUrl);
            setIsLoading(false);
            return;
          }

          // PRIORIDADE 1B: URL cached (segundo melhor)
          if (cacheData.cached_url) {
            console.log(`[MediaLoader] ✅ Usando cached URL para ${messageId}`);
            setFinalUrl(cacheData.cached_url);
            setIsLoading(false);
            return;
          }
        }

        // PRIORIDADE 2: Buscar no Storage do Supabase
        if (mediaUrl) {
          console.log(`[MediaLoader] 🔍 Tentando Storage do Supabase para ${messageId}`);
          
          // Verificar se já é uma URL do Supabase Storage
          if (mediaUrl.includes('supabase.co/storage/v1/object/public/whatsapp-media/')) {
            console.log(`[MediaLoader] ✅ URL já é do Supabase Storage: ${messageId}`);
            setFinalUrl(mediaUrl);
            setIsLoading(false);
            return;
          }

          // Tentar buscar arquivo por nome no storage
          const fileName = `${messageId}.${getFileExtension(mediaType)}`;
          try {
            const { data: storageData } = supabase.storage
              .from('whatsapp-media')
              .getPublicUrl(fileName);
            
            if (storageData?.publicUrl) {
              console.log(`[MediaLoader] ✅ Encontrado no Storage: ${messageId}`);
              setFinalUrl(storageData.publicUrl);
              setIsLoading(false);
              return;
            }
          } catch (storageError) {
            console.warn(`[MediaLoader] ⚠️ Erro no Storage: ${storageError}`);
          }
        }

        // PRIORIDADE 3: Fallback para URL original (se ainda válida)
        if (mediaUrl && !mediaUrl.includes('mmg.whatsapp.net')) {
          console.log(`[MediaLoader] 🔄 Usando URL original como fallback: ${messageId}`);
          setFinalUrl(mediaUrl);
          setIsLoading(false);
          return;
        }

        // PRIORIDADE 4: Nenhuma fonte disponível
        console.error(`[MediaLoader] ❌ Nenhuma fonte válida encontrada para ${messageId}`);
        setError('Mídia não encontrada ou expirada');
        setFinalUrl(null);

      } catch (err) {
        console.error(`[MediaLoader] ❌ Erro geral no carregamento:`, err);
        setError('Erro ao carregar mídia');
        
        // Último fallback: tentar URL original mesmo com erro
        if (mediaUrl) {
          console.log(`[MediaLoader] 🚨 Fallback de emergência para ${messageId}`);
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

// Função para determinar MIME type correto
const getMimeType = (type: string): string => {
  switch (type) {
    case 'image': return 'image/jpeg';
    case 'video': return 'video/mp4';
    case 'audio': return 'audio/ogg';
    case 'document': return 'application/pdf';
    default: return 'application/octet-stream';
  }
};

// Função para extensão de arquivo
const getFileExtension = (type: string): string => {
  switch (type) {
    case 'image': return 'jpg';
    case 'video': return 'mp4';
    case 'audio': return 'ogg';
    case 'document': return 'pdf';
    default: return 'bin';
  }
};
