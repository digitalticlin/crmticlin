
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
        // PRIORIDADE 1: Verificar cache no banco (base64 primeiro)
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

          // PRIORIDADE 1A: Base64 data (melhor performance e sempre funciona)
          if (cacheData.base64_data) {
            try {
              const mimeType = getMimeType(mediaType);
              const dataUrl = `data:${mimeType};base64,${cacheData.base64_data}`;
              console.log(`[MediaLoader] ✅ Usando base64 para ${messageId} (${dataUrl.length} chars)`);
              setFinalUrl(dataUrl);
              setIsLoading(false);
              return;
            } catch (base64Error) {
              console.warn(`[MediaLoader] ⚠️ Erro ao processar base64: ${base64Error}`);
            }
          }

          // PRIORIDADE 1B: URL cached do Supabase Storage
          if (cacheData.cached_url) {
            try {
              // Verificar se a URL é válida fazendo uma requisição HEAD
              const response = await fetch(cacheData.cached_url, { method: 'HEAD' });
              if (response.ok) {
                console.log(`[MediaLoader] ✅ Usando cached URL válida para ${messageId}`);
                setFinalUrl(cacheData.cached_url);
                setIsLoading(false);
                return;
              } else {
                console.warn(`[MediaLoader] ⚠️ Cached URL inválida (${response.status}): ${cacheData.cached_url}`);
              }
            } catch (urlError) {
              console.warn(`[MediaLoader] ⚠️ Erro ao validar cached URL: ${urlError}`);
            }
          }
        }

        // PRIORIDADE 2: Tentar buscar no Storage do Supabase
        if (mediaUrl) {
          console.log(`[MediaLoader] 🔍 Tentando Storage do Supabase para ${messageId}`);
          
          // Se já é uma URL do Supabase Storage, validar se ainda existe
          if (mediaUrl.includes('supabase.co/storage/v1/object/public/whatsapp-media/')) {
            try {
              const response = await fetch(mediaUrl, { method: 'HEAD' });
              if (response.ok) {
                console.log(`[MediaLoader] ✅ URL do Supabase Storage válida: ${messageId}`);
                setFinalUrl(mediaUrl);
                setIsLoading(false);
                return;
              } else {
                console.warn(`[MediaLoader] ⚠️ URL do Supabase Storage inválida (${response.status})`);
              }
            } catch (storageError) {
              console.warn(`[MediaLoader] ⚠️ Erro ao validar URL do Storage: ${storageError}`);
            }
          }

          // Tentar construir URL do Storage baseada no messageId
          try {
            const fileExtension = getFileExtension(mediaType);
            const fileName = `${messageId}.${fileExtension}`;
            
            const { data: storageData } = supabase.storage
              .from('whatsapp-media')
              .getPublicUrl(fileName);
            
            if (storageData?.publicUrl) {
              // Validar se o arquivo existe no storage
              const response = await fetch(storageData.publicUrl, { method: 'HEAD' });
              if (response.ok) {
                console.log(`[MediaLoader] ✅ Arquivo encontrado no Storage: ${messageId}`);
                setFinalUrl(storageData.publicUrl);
                setIsLoading(false);
                return;
              } else {
                console.warn(`[MediaLoader] ⚠️ Arquivo não encontrado no Storage (${response.status})`);
              }
            }
          } catch (storageError) {
            console.warn(`[MediaLoader] ⚠️ Erro ao acessar Storage: ${storageError}`);
          }
        }

        // PRIORIDADE 3: Fallback para URL original (apenas se não for do WhatsApp)
        if (mediaUrl && !mediaUrl.includes('mmg.whatsapp.net') && !mediaUrl.includes('pps.whatsapp.net')) {
          console.log(`[MediaLoader] 🔄 Tentando URL original como fallback: ${messageId}`);
          try {
            const response = await fetch(mediaUrl, { method: 'HEAD' });
            if (response.ok) {
              setFinalUrl(mediaUrl);
              setIsLoading(false);
              return;
            } else {
              console.warn(`[MediaLoader] ⚠️ URL original inválida (${response.status})`);
            }
          } catch (originalUrlError) {
            console.warn(`[MediaLoader] ⚠️ Erro ao validar URL original: ${originalUrlError}`);
          }
        }

        // PRIORIDADE 4: Nenhuma fonte válida encontrada
        console.error(`[MediaLoader] ❌ Nenhuma fonte válida encontrada para ${messageId}`);
        setError('Mídia não encontrada ou expirada');
        setFinalUrl(null);

      } catch (err) {
        console.error(`[MediaLoader] ❌ Erro geral no carregamento:`, err);
        setError('Erro ao carregar mídia');
        setFinalUrl(null);
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
