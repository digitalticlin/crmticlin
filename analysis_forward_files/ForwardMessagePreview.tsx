
import React from 'react';
import { Message } from '@/types/chat';
import { MessageSquare, Image, File, Video, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ForwardMessagePreviewProps {
  message: Message;
}

export const ForwardMessagePreview: React.FC<ForwardMessagePreviewProps> = ({ message }) => {
  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Mic className="w-4 h-4" />;
      case 'document':
        return <File className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-start gap-3">
        <div className="text-gray-500 mt-1">
          {getMediaIcon(message.mediaType || 'text')}
        </div>
        
        <div className="flex-1">
          {message.mediaType && message.mediaType !== 'text' && (
            <div className="text-sm text-gray-600 mb-1">
              {message.fileName || `${message.mediaType} arquivo`}
            </div>
          )}
          
          {message.text && (
            <div className="text-gray-900 whitespace-pre-wrap break-words">
              {message.text}
            </div>
          )}
          
          {!message.text && message.mediaType !== 'text' && (
            <div className="text-gray-500 italic">
              Arquivo de mídia
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-2">
            {message.time}
          </div>
        </div>
      </div>
    </div>
  );
};
