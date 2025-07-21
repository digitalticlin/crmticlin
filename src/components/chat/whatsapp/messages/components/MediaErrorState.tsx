
import React from 'react';
import { AlertCircle, RefreshCw, Image, Video, Volume2, FileText } from 'lucide-react';

interface MediaErrorStateProps {
  error?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  onRetry?: () => void;
}

export const MediaErrorState: React.FC<MediaErrorStateProps> = ({ 
  error, 
  mediaType = 'image', 
  onRetry 
}) => {
  const getIcon = () => {
    switch (mediaType) {
      case 'image': return <Image className="w-8 h-8 text-gray-400" />;
      case 'video': return <Video className="w-8 h-8 text-gray-400" />;
      case 'audio': return <Volume2 className="w-8 h-8 text-gray-400" />;
      case 'document': return <FileText className="w-8 h-8 text-gray-400" />;
      default: return <Image className="w-8 h-8 text-gray-400" />;
    }
  };

  const getDefaultMessage = () => {
    switch (mediaType) {
      case 'image': return 'Imagem não disponível';
      case 'video': return 'Vídeo não disponível';
      case 'audio': return 'Áudio não disponível';
      case 'document': return 'Documento não disponível';
      default: return 'Mídia não disponível';
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 min-w-[200px]">
      <div className="flex items-center space-x-3 text-center">
        <div className="flex-shrink-0">
          <div className="relative">
            {getIcon()}
            <AlertCircle className="absolute -top-1 -right-1 w-4 h-4 text-red-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-gray-600 font-medium block">
            {error || getDefaultMessage()}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            A mídia pode ter expirado ou não estar disponível
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-500 hover:text-blue-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
