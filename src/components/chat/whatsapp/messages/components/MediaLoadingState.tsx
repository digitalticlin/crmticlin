
import React from 'react';
import { Loader2, Image, Video, Volume2, FileText } from 'lucide-react';

interface MediaLoadingStateProps {
  mediaType?: 'image' | 'video' | 'audio' | 'document';
}

export const MediaLoadingState: React.FC<MediaLoadingStateProps> = ({ mediaType = 'image' }) => {
  const getIcon = () => {
    switch (mediaType) {
      case 'image': return <Image className="w-6 h-6 text-blue-400" />;
      case 'video': return <Video className="w-6 h-6 text-purple-400" />;
      case 'audio': return <Volume2 className="w-6 h-6 text-green-400" />;
      case 'document': return <FileText className="w-6 h-6 text-orange-400" />;
      default: return <Image className="w-6 h-6 text-blue-400" />;
    }
  };

  const getMessage = () => {
    switch (mediaType) {
      case 'image': return 'Carregando imagem...';
      case 'video': return 'Carregando vídeo...';
      case 'audio': return 'Carregando áudio...';
      case 'document': return 'Carregando documento...';
      default: return 'Carregando mídia...';
    }
  };

  return (
    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200 min-w-[200px]">
      <div className="relative">
        {getIcon()}
        <Loader2 className="absolute -top-1 -right-1 w-4 h-4 animate-spin text-blue-500" />
      </div>
      <div className="flex-1">
        <span className="text-sm text-gray-700 font-medium">{getMessage()}</span>
        <div className="flex space-x-1 mt-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};
