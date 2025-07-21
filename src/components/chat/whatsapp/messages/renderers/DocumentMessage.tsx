
import React, { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { FileText, Download, File, FileImage, FileVideo, FileAudio, ExternalLink, Loader2, RefreshCw } from 'lucide-react';

interface DocumentMessageProps {
  messageId: string;
  url: string;
  filename: string;
  isIncoming: boolean;
  isLoading?: boolean;
}

export const DocumentMessage = React.memo(({ 
  messageId, 
  url, 
  filename, 
  isIncoming, 
  isLoading = false 
}: DocumentMessageProps) => {
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Função para extrair nome do arquivo limpo
  const getCleanFilename = useCallback((filename: string) => {
    if (filename === '[Documento]' || filename === '[Mensagem não suportada]' || !filename || filename.trim() === '') {
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
  }, [url]);

  // Determinar o ícone baseado na extensão do arquivo
  const getFileIcon = useCallback((filename: string) => {
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-8 h-8 text-blue-500" />;
      case 'txt':
      case 'rtf':
        return <FileText className="w-8 h-8 text-gray-500" />;
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
      case 'zip':
      case 'rar':
      case '7z':
        return <File className="w-8 h-8 text-yellow-500" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <File className="w-8 h-8 text-emerald-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  }, []);

  // Mover cleanFilename para antes dos handlers
  const cleanFilename = getCleanFilename(filename);
  const fileIcon = getFileIcon(cleanFilename);
  const isPdfOrImage = /\.(pdf|jpg|jpeg|png|gif|webp)$/i.test(cleanFilename);

  const handleDownload = useCallback(async () => {
    if (!url || downloadLoading) return;

    setDownloadLoading(true);
    setDownloadError(false);
    
    try {
      console.log(`[DocumentMessage] 📥 Iniciando download: ${messageId}`);
      
      // Verificar se a URL é válida primeiro
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Arquivo não encontrado (${response.status})`);
      }

      // Criar link para download
      const link = document.createElement('a');
      link.href = url;
      link.download = cleanFilename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`[DocumentMessage] ✅ Download iniciado: ${messageId}`);
    } catch (error) {
      console.error(`[DocumentMessage] ❌ Erro no download: ${messageId}`, error);
      setDownloadError(true);
    } finally {
      setDownloadLoading(false);
    }
  }, [url, cleanFilename, messageId, downloadLoading]);

  const handlePreview = useCallback(async () => {
    if (!url) return;
    
    try {
      console.log(`[DocumentMessage] 👁️ Abrindo preview: ${messageId}`);
      
      // Verificar se a URL é válida
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Arquivo não encontrado (${response.status})`);
      }
      
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error(`[DocumentMessage] ❌ Erro ao abrir preview: ${messageId}`, error);
      setDownloadError(true);
    }
  }, [url, messageId]);

  const handleRetry = useCallback(() => {
    console.log(`[DocumentMessage] 🔄 Tentando novamente: ${messageId} (tentativa ${retryCount + 1})`);
    setRetryCount(prev => prev + 1);
    setDownloadError(false);
  }, [messageId, retryCount]);

  // Estado de loading
  if (isLoading) {
    return (
      <div className="flex items-center space-x-3 p-3 rounded-lg border min-w-[200px] max-w-xs bg-gray-50">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (!url) {
    return (
      <div className={cn(
        "flex items-center space-x-3 p-3 rounded-lg border min-w-[200px] max-w-xs",
        "bg-gray-50 border-gray-200"
      )}>
        <File className="w-8 h-8 text-gray-400" />
        <div className="flex-1">
          <p className="text-sm text-gray-500">Documento indisponível</p>
          {retryCount < 3 && (
            <button
              onClick={handleRetry}
              className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1"
            >
              <RefreshCw className="w-3 h-3" />
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 min-w-[200px] max-w-xs",
      isIncoming 
        ? "bg-white border-gray-200 hover:bg-gray-50" 
        : "bg-white/20 border-white/30 hover:bg-white/30"
    )}>
      {/* Ícone do arquivo */}
      <div className="flex-shrink-0">
        {fileIcon}
      </div>

      {/* Informações do arquivo */}
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
          {downloadError ? 'Erro ao carregar' : (isPdfOrImage ? 'Clique para visualizar' : 'Clique para baixar')}
        </p>
      </div>

      {/* Botões de ação */}
      <div className="flex-shrink-0 flex space-x-1">
        {isPdfOrImage && !downloadError && (
          <button
            onClick={handlePreview}
            className={cn(
              "p-2 rounded hover:bg-gray-100 transition-colors",
              isIncoming ? "text-gray-600 hover:text-gray-800" : "text-white hover:bg-white/20"
            )}
            title="Visualizar"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
        
        <button
          onClick={downloadError ? handleRetry : handleDownload}
          disabled={downloadLoading}
          className={cn(
            "p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50",
            isIncoming ? "text-gray-600 hover:text-gray-800" : "text-white hover:bg-white/20"
          )}
          title={downloadError ? "Tentar novamente" : "Baixar"}
        >
          {downloadLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : downloadError ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
});

DocumentMessage.displayName = 'DocumentMessage';
