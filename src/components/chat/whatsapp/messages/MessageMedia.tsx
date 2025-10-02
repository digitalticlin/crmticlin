
import React from 'react';
import { cn } from '@/lib/utils';
import { ImageMessage } from './renderers/ImageMessage';
import { VideoMessage } from './renderers/VideoMessage';
import { AudioMessage } from './renderers/AudioMessage';
import { DocumentMessage } from './renderers/DocumentMessage';

interface MessageMediaProps {
  messageId: string;
  mediaType?: string;
  mediaUrl?: string;
  mediaCache?: any;
  fileName?: string;
  isIncoming: boolean;
  className?: string;
}

export const MessageMedia: React.FC<MessageMediaProps> = ({
  messageId,
  mediaType,
  mediaUrl,
  mediaCache,
  fileName,
  isIncoming,
  className
}) => {
  // 🔍 DEBUG: Log ao processar mídia
  console.group(`🎨 [MessageMedia] PROCESSANDO MÍDIA`);
  console.log('═══════════════════════════════════════════');
  console.log('🆔 Message ID:', messageId);
  console.log('📁 Media Type:', mediaType);
  console.log('🔗 Media URL:', mediaUrl);
  console.log('📄 File Name:', fileName);
  console.log('═══════════════════════════════════════════');

  if (!mediaType || !mediaUrl) {
    console.error('❌ MÍDIA INVÁLIDA:', {
      hasMediaType: !!mediaType,
      hasMediaUrl: !!mediaUrl
    });
    console.log('═══════════════════════════════════════════');
    console.groupEnd();
    return null;
  }

  const commonProps = {
    messageId,
    url: mediaUrl,
    fileName: fileName || 'arquivo',
    isIncoming,
    className
  };

  console.log('✅ Props comuns preparadas:', commonProps);
  console.log('🎯 Renderizando componente:', mediaType);
  console.log('═══════════════════════════════════════════');
  console.groupEnd();

  switch (mediaType) {
    case 'image':
      return <ImageMessage {...commonProps} />;

    case 'video':
      return <VideoMessage {...commonProps} />;

    case 'audio':
    case 'ptt':  // 🎤 PTT também é áudio
    case 'voice': // 🎤 Voice também é áudio
      console.log(`🎤 [MessageMedia] Renderizando AudioMessage para tipo: ${mediaType}`);
      return <AudioMessage {...commonProps} />;

    case 'document':
      return <DocumentMessage {...commonProps} filename={fileName || 'arquivo'} />;

    default:
      console.warn(`⚠️ [MessageMedia] Tipo de mídia não suportado: ${mediaType}`);
      return (
        <div className={cn(
          "flex items-center gap-2 p-2 rounded bg-gray-100 dark:bg-gray-800",
          className
        )}>
          <span className="text-sm text-muted-foreground">
            Tipo de mídia não suportado: {mediaType}
          </span>
        </div>
      );
  }
};
