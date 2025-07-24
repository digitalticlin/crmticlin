
import React from 'react';
import { useMediaLoader } from './hooks/useMediaLoader';
import { MediaRenderer } from './components/MediaRenderer';
import { MediaLoadingState } from './components/MediaLoadingState';
import { MediaErrorState } from './components/MediaErrorState';
// 🆕 NOVO COMPONENTE PARA BOTÃO DE DOWNLOAD
import { MediaDownloadButton } from './components/MediaDownloadButton';

interface MessageMediaProps {
  messageId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  fileName?: string;
  isIncoming?: boolean;
  // ✅ NOVO: Receber media_cache da mensagem
  mediaCache?: {
    id: string;
    base64_data?: string | null;
    original_url?: string | null;
    file_size?: number | null;
    media_type?: string | null;
  } | null;
}

export const MessageMedia: React.FC<MessageMediaProps> = React.memo(({
  messageId,
  mediaType,
  mediaUrl,
  fileName,
  isIncoming = true,
  mediaCache
}) => {
  // ✅ OTIMIZAÇÃO: Early return para texto
  if (mediaType === 'text' || (!mediaUrl && !mediaCache)) {
    console.log(`[MessageMedia] ⚠️ Não é mídia válida: ${messageId} (${mediaType})`);
    return null;
  }

  // ✅ OTIMIZAÇÃO: Log condicionado em desenvolvimento para evitar spam
  if (process.env.NODE_ENV === 'development') {
    console.log(`[MessageMedia] 🎬 Renderizando mídia:`, {
      messageId: messageId.substring(0, 8) + '...',
      mediaType,
      hasMediaUrl: !!mediaUrl,
      hasMediaCache: !!mediaCache,
      fileName: fileName?.substring(0, 30) + (fileName?.length > 30 ? '...' : ''),
      isIncoming
    });
  }

  const { 
    finalUrl, 
    isLoading, 
    error, 
    // 🆕 NOVAS PROPRIEDADES
    shouldShowDownloadButton,
    originalUrl,
    isLargeMedia
  } = useMediaLoader({
    messageId,
    mediaType,
    mediaUrl,
    mediaCache
  });

  // Loading state
  if (isLoading) {
    console.log(`[MessageMedia] ⏳ Estado de carregamento para ${messageId}`);
    return <MediaLoadingState mediaType={mediaType} />;
  }

  // 🆕 BOTÃO DE DOWNLOAD PARA MÍDIAS GRANDES OU SEM BASE64
  if (shouldShowDownloadButton && originalUrl) {
    console.log(`[MessageMedia] 🔽 Renderizando botão de download para ${messageId}`);
    return (
      <MediaDownloadButton 
        messageId={messageId}
        mediaType={mediaType}
        originalUrl={originalUrl}
        fileName={fileName}
        isIncoming={isIncoming}
        isLargeMedia={isLargeMedia}
      />
    );
  }

  // Error state
  if (error || !finalUrl) {
    console.log(`[MessageMedia] ❌ Estado de erro para ${messageId}:`, error);
    return <MediaErrorState error={error} mediaType={mediaType} />;
  }

  // Success - render media component
  console.log(`[MessageMedia] ✅ Renderizando mídia com sucesso para ${messageId}`);
  return (
    <MediaRenderer
      mediaType={mediaType}
      messageId={messageId}
      url={finalUrl}
      fileName={fileName}
      isIncoming={isIncoming}
    />
  );
});
MessageMedia.displayName = 'MessageMedia';

