import React from 'react';
import { Download, Loader2 } from 'lucide-react';

interface MediaProcessButtonProps {
  isProcessing: boolean;
  onProcess: () => void;
  mediaType: string;
  disabled?: boolean;
}

export const MediaProcessButton: React.FC<MediaProcessButtonProps> = ({
  isProcessing,
  onProcess,
  mediaType,
  disabled = false
}) => {
  const getButtonText = () => {
    if (isProcessing) {
      return 'Processando...';
    }
    switch (mediaType) {
      case 'image': return 'Carregar imagem';
      case 'video': return 'Carregar vídeo';
      case 'audio': return 'Carregar áudio';
      case 'document': return 'Carregar documento';
      default: return 'Carregar mídia';
    }
  };

  return (
    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center">
        <div className="mb-3">
          {isProcessing ? (
            <Loader2 className="w-8 h-8 mx-auto text-green-600 animate-spin" />
          ) : (
            <Download className="w-8 h-8 mx-auto text-gray-400" />
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-3">
          {isProcessing ? 'Preparando mídia...' : 'Mídia grande disponível'}
        </p>
        
        <button
          onClick={onProcess}
          disabled={disabled || isProcessing}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${isProcessing || disabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
            }
          `}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}; 