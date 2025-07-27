
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

  const getCleanFilename = useCallback((filename: string) => {
    // ✅ FILTRAR LEGENDAS DESNECESSÁRIAS
    const unnecessaryPrefixes = [
      '[Documento]',
      '[Mensagem não suportada]', 
      '[Documento:',
      'Documento:'
    ];
    
    let cleanName = filename;
    
    // Remover prefixos desnecessários
    unnecessaryPrefixes.forEach(prefix => {
      if (cleanName.startsWith(prefix)) {
        cleanName = cleanName.replace(prefix, '').trim();
        if (cleanName.endsWith(']')) {
          cleanName = cleanName.slice(0, -1).trim();
        }
      }
    });
    
    if (!cleanName || cleanName.trim() === '') {
      try {
        const urlParts = url.split('/');
        const urlFilename = urlParts[urlParts.length - 1];
        const decodedFilename = decodeURIComponent(urlFilename);
        return decodedFilename.split('?')[0] || 'Documento.pdf';
      } catch {
        return 'Documento.pdf';
      }
    }
    return cleanName;
  }, [url]);

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

  const getFileSize = useCallback((url: string) => {
    // Para base64, calcular tamanho aproximado
    if (url.startsWith('data:')) {
      const base64Data = url.split(',')[1];
      if (base64Data) {
        const sizeInBytes = (base64Data.length * 3) / 4;
        return formatFileSize(sizeInBytes);
      }
    }
    return 'Tamanho desconhecido';
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const cleanFilename = getCleanFilename(filename);
  const fileIcon = getFileIcon(cleanFilename);
  const isPdfOrImage = /\.(pdf|jpg|jpeg|png|gif|webp)$/i.test(cleanFilename);
  const fileSize = getFileSize(url);

  const handleDownload = useCallback(async () => {
    if (!url || downloadLoading) return;

    setDownloadLoading(true);
    setDownloadError(false);
    
    try {
      console.log(`[DocumentMessage] 📥 Iniciando download: ${messageId}`);
      
      // Para base64, criar blob e download direto
      if (url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = url;
        link.download = cleanFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log(`[DocumentMessage] ✅ Download base64 iniciado: ${messageId}`);
        return;
      }

      // Para URLs normais, verificar se existem primeiro
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Arquivo não encontrado (${response.status})`);
      }

             const link = document.createElement('a');
       link.href = url;
       link.download = cleanFilename; // ✅ RESTAURAR download para função de baixar
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
       
       // ✅ ESTRATÉGIA OTIMIZADA: Abrir diretamente sem verificações pesadas
       if (url.startsWith('data:')) {
         // Para base64 grande, mostrar loading e abrir
         setDownloadLoading(true);
         setTimeout(() => {
           window.open(url, '_blank', 'noopener,noreferrer');
           setDownloadLoading(false);
         }, 100);
         return;
       }
       
       // Para URLs do Storage, abrir diretamente (mais rápido)
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center space-x-3 p-4 rounded-lg border min-w-[280px] max-w-xs bg-gray-50">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (!url) {
    return (
      <div className={cn(
        "flex items-center space-x-3 p-4 rounded-lg border min-w-[280px] max-w-xs",
        "bg-gray-50 border-gray-200"
      )}>
        <File className="w-8 h-8 text-gray-400" />
        <div className="flex-1">
          <p className="text-sm text-gray-500">Documento não disponível</p>
          {retryCount < 3 && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1 mt-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
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
      "flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 min-w-[280px] max-w-xs hover:shadow-md",
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
           {downloadError ? 'Erro ao carregar' : fileSize}
         </p>
      </div>

             {/* Botões de ação */}
       <div className="flex-shrink-0 flex flex-col space-y-1">
         {/* Botão principal: Visualizar (mais prominente) */}
         <button
           onClick={handlePreview}
           disabled={downloadLoading}
           className={cn(
             "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 disabled:opacity-50",
             isIncoming 
               ? "bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300" 
               : "bg-white/20 text-white hover:bg-white/30 disabled:bg-white/10"
           )}
           title="Abrir documento"
         >
           {downloadLoading ? (
             <div className="flex items-center gap-1">
               <Loader2 className="w-3 h-3 animate-spin" />
               <span>Abrindo...</span>
             </div>
           ) : (
             <div className="flex items-center gap-1">
               <ExternalLink className="w-3 h-3" />
               <span>Abrir</span>
             </div>
           )}
         </button>
         
         {/* Botão secundário: Download (menor) */}
         <button
           onClick={downloadError ? handleRetry : handleDownload}
           disabled={downloadLoading}
           className={cn(
             "p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50",
             isIncoming ? "text-gray-500 hover:text-gray-700" : "text-white/70 hover:bg-white/10"
           )}
           title={downloadError ? "Tentar novamente" : "Baixar arquivo"}
         >
           {downloadError ? (
             <RefreshCw className="w-3 h-3" />
           ) : (
             <Download className="w-3 h-3" />
           )}
         </button>
       </div>
    </div>
  );
});

DocumentMessage.displayName = 'DocumentMessage';
