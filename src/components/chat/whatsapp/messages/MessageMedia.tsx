
import React from 'react';
import { useMediaLoader } from './hooks/useMediaLoader';
import { MediaLoadingState } from './components/MediaLoadingState';
import { MediaErrorState } from './components/MediaErrorState';
import { MediaRenderer } from './components/MediaRenderer';

interface MessageMediaProps {
  messageId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  fileName?: string;
  isIncoming?: boolean;
}

export const MessageMedia: React.FC<MessageMediaProps> = React.memo(({
  messageId,
  mediaType,
  mediaUrl,
  fileName,
  isIncoming = true
}) => {
  console.log(`[MessageMedia] 🎬 Renderizando mídia:`, {
    messageId,
    mediaType,
    hasMediaUrl: !!mediaUrl,
    fileName,
    isIncoming
  });

  const { finalUrl, isLoading, error } = useMediaLoader({
    messageId,
    mediaType,
    mediaUrl
  });

  // Loading state
  if (isLoading) {
    console.log(`[MessageMedia] ⏳ Estado de carregamento para ${messageId}`);
    return <MediaLoadingState mediaType={mediaType} />;
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

MessageMedia.displayName = "MessageMedia";
