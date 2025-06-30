import React from 'react';
import { cn } from '@/lib/utils';
import { FileText, Download, File, FileImage, FileVideo, FileAudio } from 'lucide-react';
import { useMediaDownload } from '../hooks/useMediaDownload';

interface DocumentMessageProps {
  messageId: string;
  url: string;
  filename: string;
  isIncoming: boolean;
  isLoading?: boolean;
}

export const DocumentMessage = ({ messageId, url, filename, isIncoming, isLoading: cacheLoading = false }: DocumentMessageProps) => {
  // Mostrar loader enquanto está processando cache
  if (cacheLoading) {
    return (
      <div className={cn(
        "flex items-center space-x-3 p-3 rounded-lg border min-w-[200px] max-w-xs",
        isIncoming 
          ? "bg-white/70 border-white/40" 
          : "bg-white/20 border-white/30"
      )}>
        <div className="flex-shrink-0">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent"></div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium",
            isIncoming ? "text-gray-900" : "text-white"
          )}>
            Carregando documento...
          </p>
        </div>
      </div>
    );
  }

  // Função para extrair nome do arquivo limpo
  const getCleanFilename = (filename: string) => {
    // Se filename contém '[Documento]', usar apenas o nome do arquivo da URL
    if (filename === '[Documento]' || !filename || filename.trim() === '') {
      try {
        const urlParts = url.split('/');
        const urlFilename = urlParts[urlParts.length - 1];
        const decodedFilename = decodeURIComponent(urlFilename);
        return decodedFilename.split('?')[0] || 'Documento';
      } catch {
        return 'Documento';
      }
    }
    return filename;
  };

  // Determinar o ícone baseado na extensão do arquivo
  const getFileIcon = (filename: string) => {
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
      case 'rtf':
        return <FileText className="w-8 h-8 text-blue-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <FileImage className="w-8 h-8 text-green-500" />;
      case 'mp4':
      case 'avi':
      case 'mkv':
      case 'mov':
        return <FileVideo className="w-8 h-8 text-purple-500" />;
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'flac':
        return <FileAudio className="w-8 h-8 text-orange-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const cleanFilename = getCleanFilename(filename);
  
  const { openMedia, isDownloading } = useMediaDownload({ 
    url, 
    filename: cleanFilename, 
    mediaType: 'document' 
  });

  const handleDownload = () => {
    openMedia();
  };

  const fileIcon = getFileIcon(cleanFilename);

  return (
    <div 
      className={cn(
        "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-[1.02] min-w-[200px] max-w-xs",
        isIncoming 
          ? "bg-white/70 border-white/40 hover:bg-white/80" 
          : "bg-white/20 border-white/30 hover:bg-white/30"
      )}
      onClick={handleDownload}
    >
      <div className="flex-shrink-0">
        {fileIcon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isIncoming ? "text-gray-900" : "text-white"
        )}>
          {cleanFilename}
        </p>
        <p className={cn(
          "text-xs opacity-70",
          isIncoming ? "text-gray-600" : "text-white"
        )}>
          Clique para baixar
        </p>
      </div>
      <div className="flex-shrink-0">
        <Download className={cn(
          "w-5 h-5 opacity-70",
          isIncoming ? "text-gray-600" : "text-white"
        )} />
      </div>
    </div>
  );
}; 