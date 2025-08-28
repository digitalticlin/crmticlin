
import React from 'react';
import { DocumentViewer } from '../components/DocumentViewer';

interface DocumentMessageProps {
  messageId: string;
  url: string;
  filename: string;
  caption?: string;
  isIncoming: boolean;
  isLoading?: boolean;
}

export const DocumentMessage = React.memo(({ 
  messageId, 
  url, 
  filename, 
  caption,
  isIncoming, 
  isLoading = false 
}: DocumentMessageProps) => {
  // ✅ USAR NOVO DOCUMENTVIEWER COM FUNCIONALIDADE COMPLETA
  return (
    <DocumentViewer
      messageId={messageId}
      url={url}
      filename={filename}
      caption={caption}
      isIncoming={isIncoming}
      isLoading={isLoading}
    />
  );
});

DocumentMessage.displayName = 'DocumentMessage';
