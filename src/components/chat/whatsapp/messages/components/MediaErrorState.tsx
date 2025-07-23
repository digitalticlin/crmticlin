
import React from 'react';
import { AlertCircle, RefreshCw, Image, Video, Volume2, FileText, Clock, Wifi } from 'lucide-react';

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

  const getErrorInfo = () => {
    const baseMessage = () => {
      switch (mediaType) {
        case 'image': return 'Imagem não disponível';
        case 'video': return 'Vídeo não disponível';
        case 'audio': return 'Áudio não disponível';
        case 'document': return 'Documento não disponível';
        default: return 'Mídia não disponível';
      }
    };

    // Personalizar mensagem e ícone baseado no tipo de erro
    switch (error) {
      case 'Mídia não processada':
        return {
          message: baseMessage(),
          description: 'Esta mídia ainda está sendo processada pelo sistema',
          icon: <Clock className="w-4 h-4 text-orange-400" />,
          color: 'orange'
        };
      
      case 'URL temporária expirada':
        return {
          message: baseMessage(),
          description: 'A URL temporária do WhatsApp expirou',
          icon: <Wifi className="w-4 h-4 text-red-400" />,
          color: 'red'
        };
      
      case 'Erro ao carregar mídia':
        return {
          message: 'Erro de conexão',
          description: 'Verifique sua conexão com a internet',
          icon: <Wifi className="w-4 h-4 text-red-400" />,
          color: 'red'
        };
      
      case 'Mídia não encontrada':
      default:
        return {
          message: baseMessage(),
          description: 'Esta mídia não está mais disponível',
          icon: <AlertCircle className="w-4 h-4 text-gray-400" />,
          color: 'gray'
        };
    }
  };

  const errorInfo = getErrorInfo();
  
  const getColorClasses = () => {
    switch (errorInfo.color) {
      case 'orange':
        return {
          border: 'border-orange-200',
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          desc: 'text-orange-600'
        };
      case 'red':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          text: 'text-red-700',
          desc: 'text-red-600'
        };
      default:
        return {
          border: 'border-gray-200',
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          desc: 'text-gray-500'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`p-4 ${colors.bg} rounded-lg border-2 border-dashed ${colors.border} min-w-[200px]`}>
      <div className="flex items-center space-x-3 text-center">
        <div className="flex-shrink-0">
          <div className="relative">
            {getIcon()}
            <div className="absolute -top-1 -right-1">
              {errorInfo.icon}
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium block ${colors.text}`}>
            {errorInfo.message}
          </span>
          <p className={`text-xs mt-1 ${colors.desc}`}>
            {errorInfo.description}
          </p>
          {onRetry && (error === 'Erro ao carregar mídia' || error === 'URL temporária expirada') && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-500 hover:text-blue-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Tentar novamente
            </button>
          )}
          {error === 'Mídia não processada' && (
            <p className="text-xs text-orange-500 mt-1 italic">
              Aguarde alguns minutos e recarregue a conversa
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
