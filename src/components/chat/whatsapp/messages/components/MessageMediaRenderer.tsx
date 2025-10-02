
import React, { useEffect } from 'react';
import { MessageMedia } from '../MessageMedia';

interface MessageMediaRendererProps {
  message: any;
  className?: string;
}

export const MessageMediaRenderer: React.FC<MessageMediaRendererProps> = ({
  message,
  className
}) => {
  // 🔍 DEBUG: Log de dados da mensagem ao renderizar mídia
  useEffect(() => {
    if (message.media_type && message.media_type !== 'text') {
      console.group(`🎬 [MessageMediaRenderer] RENDERIZANDO MÍDIA`);
      console.log('═══════════════════════════════════════════');
      console.log('🆔 Message ID:', message.id);
      console.log('📁 Media Type:', message.media_type);
      console.log('🔗 Media URL:', message.media_url);
      console.log('📄 File Name:', message.file_name);
      console.log('📥 Is Incoming:', message.isIncoming);
      console.log('💾 Media Cache:', message.media_cache);
      console.log('═══════════════════════════════════════════');
      console.log('🔍 VALIDAÇÕES:');
      console.log('  ✅ Tem media_type?', !!message.media_type);
      console.log('  ✅ Tem media_url?', !!message.media_url);
      console.log('  ✅ URL válida?', message.media_url?.startsWith('http') || message.media_url?.startsWith('blob'));
      console.log('  ✅ É áudio?', message.media_type === 'audio');
      console.log('  ✅ É voz (ptt)?', message.media_type === 'ptt' || message.media_type === 'voice');
      console.log('═══════════════════════════════════════════');
      console.log('📊 OBJETO COMPLETO DA MENSAGEM:', message);
      console.log('═══════════════════════════════════════════');
      console.groupEnd();
    }
  }, [message]);

  // Only render if message has media
  if (!message.media_type || message.media_type === 'text') {
    return null;
  }

  return (
    <MessageMedia
      messageId={message.id}
      mediaType={message.media_type}
      mediaUrl={message.media_url}
      fileName={message.file_name}
      isIncoming={message.isIncoming}
      mediaCache={message.media_cache}
      className={className}
    />
  );
};
