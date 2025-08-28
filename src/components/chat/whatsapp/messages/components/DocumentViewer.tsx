import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { FileText, Eye, Download, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { SimpleMediaPortal } from './SimpleMediaPortal';

interface DocumentViewerProps {
  messageId: string;
  url: string;
  filename: string;
  caption?: string;
  isIncoming: boolean;
  isLoading?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  messageId,
  url,
  filename,
  caption,
  isIncoming,
  isLoading = false
}) => {
  const [isViewing, setIsViewing] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [viewerError, setViewerError] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(true);

  // ✅ LIMPAR NOME DO ARQUIVO
  const getCleanFilename = useCallback((filename: string) => {
    const unnecessaryPrefixes = [
      '[Documento]',
      '[Mensagem não suportada]', 
      '[Documento:',
      'Documento:',
      'document:',
      'Document:'
    ];
    
    let cleanName = filename;
    
    // Remove prefixos desnecessários
    unnecessaryPrefixes.forEach(prefix => {
      if (cleanName.startsWith(prefix)) {
        cleanName = cleanName.replace(prefix, '').trim();
        if (cleanName.endsWith(']')) {
          cleanName = cleanName.slice(0, -1).trim();
        }
      }
    });
    
    // Se não há nome limpo, tentar extrair da URL
    if (!cleanName || cleanName.trim() === '') {
      try {
        const urlParts = url.split('/');
        const urlFilename = urlParts[urlParts.length - 1];
        const decodedFilename = decodeURIComponent(urlFilename);
        cleanName = decodedFilename.split('?')[0] || 'documento';
      } catch {
        cleanName = 'documento';
      }
    }
    
    // Se ainda não há extensão, tentar detectar pelo content-type da URL
    if (!cleanName.includes('.')) {
      if (url.includes('image/')) {
        cleanName += '.jpg';
      } else if (url.includes('pdf') || url.toLowerCase().includes('.pdf')) {
        cleanName += '.pdf';
      } else if (url.includes('doc')) {
        cleanName += '.docx';
      } else {
        cleanName += '.pdf'; // default
      }
    }
    
    return cleanName;
  }, [url]);

  // ✅ VERIFICAR SE É VISUALIZÁVEL
  const isViewable = useCallback((filename: string) => {
    const extension = filename.toLowerCase().split('.').pop();
    
    const viewableTypes = [
      // PDFs
      'pdf',
      // Imagens
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff',
      // Texto
      'txt', 'md', 'csv', 'json', 'xml', 'html',
      // Documentos que podem ser visualizados via Google Docs Viewer
      'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp',
      // Outros formatos comuns
      'rtf'
    ];
    
    return viewableTypes.includes(extension || '');
  }, []);

  // ✅ OBTER ÍCONE DO ARQUIVO
  const getFileIcon = useCallback((filename: string) => {
    const extension = filename.toLowerCase().split('.').pop();
    
    const iconColor = isIncoming ? 'text-blue-500' : 'text-white';
    
    switch (extension) {
      case 'pdf':
        return <FileText className={`w-8 h-8 text-red-500`} />;
      case 'doc':
      case 'docx':
        return <FileText className={`w-8 h-8 text-blue-500`} />;
      case 'txt':
      case 'md':
        return <FileText className={`w-8 h-8 ${iconColor}`} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <FileText className={`w-8 h-8 text-green-500`} />;
      default:
        return <FileText className={`w-8 h-8 ${iconColor}`} />;
    }
  }, [isIncoming]);

  const cleanFilename = getCleanFilename(filename);
  const canView = isViewable(cleanFilename);
  const fileIcon = getFileIcon(cleanFilename);

  // ✅ DEBUG PARA VERIFICAR VISUALIZAÇÃO
  if (process.env.NODE_ENV === 'development') {
    console.log('DocumentViewer Debug:', {
      messageId: messageId.substring(0, 8),
      filename,
      cleanFilename,
      canView,
      extension: cleanFilename.toLowerCase().split('.').pop(),
      url: url.substring(0, 50) + '...'
    });
  }

  // ✅ DOWNLOAD FUNCTIONALITY
  const handleDownload = useCallback(async () => {
    if (!url || downloadLoading) return;

    setDownloadLoading(true);
    setDownloadError(false);
    
    try {
      console.log(`[DocumentViewer] 📥 Iniciando download: ${messageId}`);
      
      if (url.startsWith('data:')) {
        // Base64 download
        const link = document.createElement('a');
        link.href = url;
        link.download = cleanFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`[DocumentViewer] ✅ Download base64 concluído: ${messageId}`);
        return;
      }

      // External URL download
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Arquivo não encontrado (${response.status})`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log(`[DocumentViewer] ✅ Download concluído: ${messageId}`);
    } catch (error) {
      console.error(`[DocumentViewer] ❌ Erro no download: ${messageId}`, error);
      setDownloadError(true);
    } finally {
      setDownloadLoading(false);
    }
  }, [url, cleanFilename, messageId, downloadLoading]);

  // ✅ VIEW FUNCTIONALITY
  const handleView = useCallback(() => {
    console.log('Attempting to view document:', { 
      messageId: messageId.substring(0, 8), 
      canView, 
      url: url.substring(0, 50), 
      filename: cleanFilename 
    });
    
    if (!canView || !url) {
      console.log('Cannot view document:', { canView, hasUrl: !!url });
      return;
    }
    
    setIsViewing(true);
    setViewerError(false);
    setViewerLoading(true);
  }, [canView, url, messageId, cleanFilename]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setDownloadError(false);
    setViewerError(false);
  }, []);

  // ✅ RENDER VIEWER CONTENT
  const renderViewerContent = useCallback(() => {
    if (!url) return null;

    const extension = cleanFilename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'pdf':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
            {viewerLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-600">Carregando PDF...</span>
                </div>
              </div>
            )}
            {viewerError ? (
              <div className="text-center p-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Erro ao carregar PDF</p>
                <button
                  onClick={() => window.open(url, '_blank')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir em nova aba
                </button>
              </div>
            ) : (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                className="w-full h-full rounded-lg border-0"
                onLoad={() => setViewerLoading(false)}
                onError={() => {
                  setViewerError(true);
                  setViewerLoading(false);
                }}
                title={`Visualização de ${cleanFilename}`}
              />
            )}
          </div>
        );
      
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={url}
              alt={cleanFilename}
              className="max-w-full max-h-full object-contain rounded-lg"
              onLoad={() => setViewerLoading(false)}
              onError={() => {
                setViewerError(true);
                setViewerLoading(false);
              }}
            />
          </div>
        );
      
      case 'txt':
      case 'md':
      case 'csv':
        return (
          <div className="w-full h-full bg-white rounded-lg p-6">
            <iframe
              src={url}
              className="w-full h-full border-0"
              onLoad={() => setViewerLoading(false)}
              onError={() => {
                setViewerError(true);
                setViewerLoading(false);
              }}
              title={`Visualização de ${cleanFilename}`}
            />
          </div>
        );
      
      case 'doc':
      case 'docx':
      case 'xls':
      case 'xlsx':
      case 'ppt':
      case 'pptx':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
            {viewerLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-600">Carregando documento...</span>
                </div>
              </div>
            )}
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
              className="w-full h-full rounded-lg border-0"
              onLoad={() => setViewerLoading(false)}
              onError={() => {
                setViewerError(true);
                setViewerLoading(false);
              }}
              title={`Visualização de ${cleanFilename}`}
            />
          </div>
        );
      
      default:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center p-8">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Tipo de arquivo não suportado para visualização</p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar arquivo
              </button>
            </div>
          </div>
        );
    }
  }, [url, cleanFilename, viewerLoading, viewerError, handleDownload]);

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

  return (
    <>
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

        {/* Nome e informações */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium truncate",
            isIncoming ? "text-gray-700" : "text-white"
          )}>
            {caption || cleanFilename || 'Documento'}
          </p>
          {caption && cleanFilename && caption !== cleanFilename && (
            <p className={cn(
              "text-xs mt-1 opacity-60 truncate",
              isIncoming ? "text-gray-500" : "text-white/60"
            )}>
              {cleanFilename}
            </p>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex-shrink-0 flex gap-2">
          {/* Botão Visualizar - Sempre mostrar, mesmo que abra em nova aba */}
          <button
            onClick={canView ? handleView : () => window.open(url, '_blank')}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-md",
              isIncoming 
                ? "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg"
                : "bg-blue-500/90 text-white hover:bg-blue-600 hover:shadow-lg"
            )}
            title={canView ? "Visualizar documento" : "Abrir em nova aba"}
          >
            <Eye className="w-4 h-4" />
            Ver
          </button>
          
          {/* Botão Baixar */}
          <button
            onClick={downloadError ? handleRetry : handleDownload}
            disabled={downloadLoading}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-2",
              isIncoming 
                ? "bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300"
                : "bg-white/20 text-white hover:bg-white/30 disabled:bg-white/10"
            )}
            title={downloadError ? "Tentar novamente" : "Baixar documento"}
          >
            {downloadLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloadLoading ? "Baixando..." : downloadError ? "Tentar" : "Baixar"}
          </button>
        </div>
      </div>

      {/* ✅ MODAL DE VISUALIZAÇÃO SIMPLIFICADO */}
      <SimpleMediaPortal
        isOpen={isViewing}
        onClose={() => setIsViewing(false)}
        title={`${cleanFilename}`}
        showZoomControls={false}
        showDownloadButton={true}
        onDownload={handleDownload}
      >
        <div className="w-full h-full min-h-[70vh] p-4">
          {renderViewerContent()}
        </div>
      </SimpleMediaPortal>
    </>
  );
};

DocumentViewer.displayName = 'DocumentViewer';