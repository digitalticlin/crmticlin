
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileIcon, X, Send, Loader2, Video, Music, FileText, Check } from 'lucide-react';
import { useMediaUpload, type UploadedFile } from '@/hooks/whatsapp/chat/useMediaUpload';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
}

export const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  open,
  onOpenChange,
  onSendMessage
}) => {
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isUploading, uploadProgress, processFile, sendFile } = useMediaUpload({
    onSendMessage
  });

  const handleClose = () => {
    setSelectedFiles([]);
    setIsSending(false);
    setCurrentProcessingIndex(-1);
    onOpenChange(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (files.length > 25) {
      toast.error('Máximo de 25 arquivos por vez');
      return;
    }

    const uploadedFiles: UploadedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      setCurrentProcessingIndex(i);
      const uploadedFile = await processFile(files[i]);
      if (uploadedFile) {
        uploadedFiles.push(uploadedFile);
      }
    }

    setSelectedFiles(uploadedFiles);
    setCurrentProcessingIndex(-1);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendAll = async () => {
    if (selectedFiles.length === 0) return;

    setIsSending(true);
    let successCount = 0;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        setCurrentProcessingIndex(i);
        const success = await sendFile(selectedFiles[i], '');
        if (success) {
          successCount++;
        }
        if (i < selectedFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (successCount === selectedFiles.length) {
        toast.success(`${successCount} arquivo${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''} com sucesso!`);
        handleClose();
      } else {
        toast.warning(`${successCount} de ${selectedFiles.length} arquivos enviados`);
      }
    } finally {
      setIsSending(false);
      setCurrentProcessingIndex(-1);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAll = () => {
    setSelectedFiles([]);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-8 w-8 text-gray-600" />;
      case 'audio':
        return <Music className="h-8 w-8 text-gray-600" />;
      case 'document':
        return <FileText className="h-8 w-8 text-gray-600" />;
      default:
        return <FileIcon className="h-8 w-8 text-gray-600" />;
    }
  };

  const getFileTypeName = (type: string) => {
    switch (type) {
      case 'video':
        return 'Vídeo';
      case 'audio':
        return 'Áudio';
      case 'document':
        return 'Documento';
      default:
        return 'Arquivo';
    }
  };

  const canSend = selectedFiles.length > 0 && !isUploading && !isSending;
  const isProcessing = isUploading || (isSending && currentProcessingIndex >= 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col",
        "bg-white/95 backdrop-blur-xl border border-gray-200/30",
        "shadow-xl backdrop-saturate-150"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileIcon className="h-5 w-5 text-gray-600" />
            Enviar Arquivo{selectedFiles.length > 1 ? 's' : ''}
            {selectedFiles.length > 0 && (
              <span className="text-sm text-gray-500">({selectedFiles.length}/25)</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Área de Upload */}
          {selectedFiles.length === 0 && (
            <div className={cn(
              "border-2 border-dashed border-gray-300/50 rounded-2xl p-8 text-center",
              "bg-white/50 backdrop-blur-sm"
            )}>
              <FileIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2 font-medium">
                Selecione arquivos para enviar
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Suporta: Documentos, Vídeos, Áudios • Máx. 25 arquivos, 50MB cada
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-gray-800 hover:bg-gray-900 text-white shadow-lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <FileIcon className="h-4 w-4 mr-2" />
                    Escolher Arquivos
                  </>
                )}
              </Button>
              
              {isUploading && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-gray-500 mt-2">
                    Processando arquivo {currentProcessingIndex + 1}... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Lista de Arquivos Selecionados */}
          {selectedFiles.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  {selectedFiles.length} arquivo{selectedFiles.length > 1 ? 's' : ''} selecionado{selectedFiles.length > 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedFiles.length >= 25 || isProcessing}
                    className="backdrop-blur-sm bg-white/50 border-gray-200"
                  >
                    <FileIcon className="h-4 w-4 mr-1" />
                    Adicionar Mais
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAll}
                    disabled={isProcessing}
                    className="backdrop-blur-sm bg-white/50 border-gray-200"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar Todos
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className={cn(
                    "border border-gray-200/30 rounded-xl p-4 relative",
                    "bg-white/50 backdrop-blur-sm"
                  )}>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white/60 backdrop-blur-sm rounded-xl">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 truncate">
                          {file.name}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="bg-gray-100/60 px-2 py-1 rounded-lg font-medium">
                            {getFileTypeName(file.type)}
                          </span>
                          <span>•</span>
                          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                      
                      {/* Indicadores de status */}
                      <div className="flex items-center gap-2">
                        {isSending && currentProcessingIndex === index && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        )}
                        {isSending && currentProcessingIndex > index && (
                          <div className="bg-green-500 rounded-full p-1.5">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          disabled={isProcessing}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Preview especial para vídeo */}
                    {file.type === 'video' && (
                      <div className="mt-4">
                        <video 
                          src={file.url} 
                          className="w-full h-32 object-cover rounded-lg bg-gray-100"
                          controls={false}
                          muted
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progresso de envio */}
          {isSending && (
            <div className="bg-gray-50/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/30">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="text-sm font-medium">
                  Enviando arquivo {currentProcessingIndex + 1} de {selectedFiles.length}
                </span>
              </div>
              <Progress 
                value={((currentProcessingIndex + 1) / selectedFiles.length) * 100} 
                className="w-full" 
              />
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 backdrop-blur-sm bg-white/50 border-gray-200"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendAll}
              disabled={!canSend}
              className={cn(
                "flex-1 bg-gray-800 hover:bg-gray-900 text-white shadow-lg",
                !canSend && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando {currentProcessingIndex + 1}/{selectedFiles.length}...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar {selectedFiles.length} Arquivo{selectedFiles.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};
