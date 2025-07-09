
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
}

export const MessageMedia: React.FC<MessageMediaProps> = React.memo(({
  messageId,
  mediaType,
  mediaUrl,
  fileName
}) => {
  const { finalUrl, isLoading, error } = useMediaLoader({
    messageId,
    mediaType,
    mediaUrl
  });

  // Loading state
  if (isLoading) {
    return <MediaLoadingState />;
  }

  // Error state
  if (error || !finalUrl) {
    return <MediaErrorState error={error} />;
  }

  // Render media component
  return (
    <MediaRenderer
      mediaType={mediaType}
      messageId={messageId}
      url={finalUrl}
      fileName={fileName}
      isIncoming={true}
    />
  );
});

MessageMedia.displayName = "MessageMedia";
