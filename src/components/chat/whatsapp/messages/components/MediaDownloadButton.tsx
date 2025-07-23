import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Download, 
  FileText, 
  Image, 
  Video, 
  Volume2, 
  Loader2,
  AlertCircle,
  CheckCircle 
} from 'lucide-react';
import { toast } from 'sonner';

interface MediaDownloadButtonProps {
  messageId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  originalUrl: string;
  fileName?: string;
  isIncoming?: boolean;
  isLargeMedia?: boolean;
}

export const MediaDownloadButton: React.FC<MediaDownloadButtonProps> = ({
  messageId,
  mediaType,
  originalUrl,
  fileName,
  isIncoming = true,
  isLargeMedia = false
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');

  const getMediaIcon = useCallback(() => {
    const iconProps = { className: "w-8 h-8" };
    
    switch (mediaType) {
      case 'image':
        return <Image {...iconProps} className="w-8 h-8 text-green-500" />;
      case 'video':
        return <Video {...iconProps} className="w-8 h-8 text-blue-500" />;
      case 'audio':
        return <Volume2 {...iconProps} className="w-8 h-8 text-orange-500" />;
      case 'document':
        return <FileText {...iconProps} className="w-8 h-8 text-red-500" />;
      default:
        return <FileText {...iconProps} className="w-8 h-8 text-gray-500" />;
    }
  }, [mediaType]);

  const getMediaTypeLabel = useCallback(() => {
    switch (mediaType) {
      case 'image': return 'Imagem';
      case 'video': return 'Vídeo';
      case 'audio': return 'Áudio';
      case 'document': return 'Documento';
      default: return 'Arquivo';
    }
  }, [mediaType]);

  const getFileName = useCallback(() => {
    if (fileName && fileName !== `[${getMediaTypeLabel()}]`) {
      return fileName;
    }
    
    // Extrair nome do arquivo da URL se possível
    try {
      const urlParts = originalUrl.split('/');
      const urlFileName = urlParts[urlParts.length - 1];
      const decodedFileName = decodeURIComponent(urlFileName);
      const cleanName = decodedFileName.split('?')[0];
      
      if (cleanName && cleanName !== 'undefined' && cleanName.length > 3) {
        return cleanName;
      }
    } catch {
      // Falha silenciosa
    }
    
    // Fallback para nome genérico
    const extension = mediaType === 'document' ? 'pdf' : mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'mp3';
    return `${getMediaTypeLabel().toLowerCase()}_${messageId.substring(0, 8)}.${extension}`;
  }, [fileName, originalUrl, mediaType, messageId, getMediaTypeLabel]);

  const handleDownload = useCallback(async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setDownloadStatus('downloading');
    
    try {
      console.log(`[MediaDownloadButton] 📥 Iniciando download: ${messageId}`);
      
      // Fazer fetch da URL original
      const response = await fetch(originalUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'WhatsApp-Media-Download/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      // Criar blob do conteúdo
      const blob = await response.blob();
      const finalFileName = getFileName();
      
      // Criar URL temporário e fazer download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = finalFileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL temporário
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log(`[MediaDownloadButton] ✅ Download concluído: ${messageId}`);
      setDownloadStatus('success');
      toast.success(`${getMediaTypeLabel()} baixado com sucesso!`);
      
      // Resetar status após 3 segundos
      setTimeout(() => {
        setDownloadStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error(`[MediaDownloadButton] ❌ Erro no download: ${messageId}`, error);
      setDownloadStatus('error');
      toast.error(`Erro ao baixar ${getMediaTypeLabel().toLowerCase()}: ${error.message}`);
      
      // Resetar status após 5 segundos
      setTimeout(() => {
        setDownloadStatus('idle');
      }, 5000);
    } finally {
      setIsDownloading(false);
    }
  }, [originalUrl, messageId, getFileName, getMediaTypeLabel, isDownloading]);

  const getStatusIcon = useCallback(() => {
    switch (downloadStatus) {
      case 'downloading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Download className="w-5 h-5" />;
    }
  }, [downloadStatus]);

  const getStatusText = useCallback(() => {
    switch (downloadStatus) {
      case 'downloading':
        return 'Baixando...';
      case 'success':
        return 'Baixado!';
      case 'error':
        return 'Erro no download';
      default:
        return isLargeMedia ? 'Clique para baixar' : 'Mídia não disponível - Clique para baixar';
    }
  }, [downloadStatus, isLargeMedia]);

  return (
    <div className={cn(
      "flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 min-w-[280px] max-w-xs",
      isIncoming 
        ? "bg-white border-gray-200 hover:bg-gray-50" 
        : "bg-white/20 border-white/30 hover:bg-white/30",
      downloadStatus === 'error' && "border-red-200 bg-red-50",
      downloadStatus === 'success' && "border-green-200 bg-green-50"
    )}>
      {/* Ícone do tipo de mídia */}
      <div className="flex-shrink-0">
        {getMediaIcon()}
      </div>

      {/* Informações do arquivo */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isIncoming ? "text-gray-900" : "text-white",
          downloadStatus === 'error' && "text-red-700",
          downloadStatus === 'success' && "text-green-700"
        )}>
          {getFileName()}
        </p>
        
        <p className={cn(
          "text-xs mt-1",
          isIncoming ? "text-gray-600" : "text-white/80",
          downloadStatus === 'error' && "text-red-600",
          downloadStatus === 'success' && "text-green-600"
        )}>
          {getStatusText()}
        </p>

        {isLargeMedia && downloadStatus === 'idle' && (
          <p className={cn(
            "text-xs mt-1 opacity-75",
            isIncoming ? "text-blue-600" : "text-white"
          )}>
            Arquivo grande - Download sob demanda
          </p>
        )}
      </div>

      {/* Botão de download */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={cn(
          "p-2 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
          isIncoming 
            ? "text-gray-600 hover:text-gray-800 hover:bg-gray-100" 
            : "text-white hover:bg-white/20",
          downloadStatus === 'success' && "text-green-600",
          downloadStatus === 'error' && "text-red-600"
        )}
        title={getStatusText()}
      >
        {getStatusIcon()}
      </button>
    </div>
  );
};

MediaDownloadButton.displayName = 'MediaDownloadButton'; 