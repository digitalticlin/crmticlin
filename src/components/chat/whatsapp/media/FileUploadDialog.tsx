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
        return <Video className="h-8 w-8 text-blue-500" />;
      case 'audio':
        return <Music className="h-8 w-8 text-green-500" />;
      case 'document':
        return <FileText className="h-8 w-8 text-red-500" />;
      default:
        return <FileIcon className="h-8 w-8 text-gray-500" />;
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
        "bg-white/95 backdrop-blur-xl border border-white/30",
        "shadow-glass-lg rounded-3xl"
      )}>
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-3 text-gray-800 font-semibold">
            <div className="p-2 bg-blue-100/80 backdrop-blur-sm rounded-xl">
              <FileIcon className="h-5 w-5 text-blue-600" />
            </div>
            Enviar Arquivo{selectedFiles.length > 1 ? 's' : ''}
            {selectedFiles.length > 0 && (
              <span className="text-sm text-gray-500 bg-gray-100/60 px-2 py-1 rounded-full">
                ({selectedFiles.length}/25)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Área de Upload */}
          {selectedFiles.length === 0 && (
            <div className={cn(
              "border-2 border-dashed border-blue-300/50 rounded-2xl p-8 text-center",
              "bg-gradient-to-br from-blue-50/80 to-indigo-50/60 backdrop-blur-sm",
              "transition-all duration-300 hover:border-blue-400/60 hover:bg-gradient-to-br hover:from-blue-50/90 hover:to-indigo-50/80"
            )}>
              <div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl w-fit mx-auto mb-4">
                <FileIcon className="h-12 w-12 text-blue-600" />
              </div>
              <p className="text-gray-700 font-medium mb-2">
                Selecione arquivos para enviar
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Suporta: Documentos, Vídeos, Áudios • Máx. 25 arquivos, 50MB cada
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                  "text-white font-medium px-6 py-3 rounded-xl shadow-lg",
                  "transition-all duration-300 hover:shadow-xl hover:scale-105",
                  "backdrop-blur-sm border border-white/20"
                )}
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
              
              {/* Progress Bar para processamento */}
              {isUploading && (
                <div className="mt-6 bg-white/70 backdrop-blur-sm rounded-xl p-4">
                  <Progress value={uploadProgress} className="w-full h-2 mb-2" />
                  <p className="text-sm text-gray-600 font-medium">
                    Processando arquivo {currentProcessingIndex + 1}... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Lista de Arquivos Selecionados */}
          {selectedFiles.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <div className={cn(
                "flex items-center justify-between mb-4 p-3 rounded-xl",
                "bg-gradient-to-r from-blue-50/80 to-indigo-50/60 backdrop-blur-sm",
                "border border-blue-200/30"
              )}>
                <span className="text-sm font-semibold text-gray-700">
                  {selectedFiles.length} arquivo{selectedFiles.length > 1 ? 's' : ''} selecionado{selectedFiles.length > 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedFiles.length >= 25 || isProcessing}
                    className={cn(
                      "bg-white/70 hover:bg-white/90 backdrop-blur-sm",
                      "border-blue-200/50 text-blue-700 hover:text-blue-800",
                      "rounded-lg transition-all duration-200"
                    )}
                  >
                    <FileIcon className="h-4 w-4 mr-1" />
                    Adicionar Mais
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAll}
                    disabled={isProcessing}
                    className={cn(
                      "bg-red-50/70 hover:bg-red-100/80 backdrop-blur-sm",
                      "border-red-200/50 text-red-600 hover:text-red-700",
                      "rounded-lg transition-all duration-200"
                    )}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar Todos
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className={cn(
                    "border border-white/30 rounded-xl p-4 relative",
                    "bg-gradient-to-br from-white/80 to-gray-50/60 backdrop-blur-sm",
                    "shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
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
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        )}
                        {isSending && currentProcessingIndex > index && (
                          <div className="bg-green-500/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          disabled={isProcessing}
                          className={cn(
                            "text-gray-400 hover:text-red-600 hover:bg-red-50/80 backdrop-blur-sm",
                            "rounded-lg transition-all duration-200"
                          )}
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
                          className="w-full h-32 object-cover rounded-lg bg-gray-100 shadow-inner"
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
            <div className={cn(
              "bg-gradient-to-r from-blue-50/80 to-indigo-50/60 backdrop-blur-sm",
              "border border-blue-200/30 rounded-xl p-4"
            )}>
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">
                  Enviando arquivo {currentProcessingIndex + 1} de {selectedFiles.length}
                </span>
              </div>
              <Progress 
                value={((currentProcessingIndex + 1) / selectedFiles.length) * 100} 
                className="w-full h-2" 
              />
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className={cn(
                "flex-1 bg-white/70 hover:bg-white/90 backdrop-blur-sm",
                "border-gray-200/50 text-gray-700 hover:text-gray-800",
                "rounded-xl font-medium transition-all duration-200"
              )}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendAll}
              disabled={!canSend}
              className={cn(
                "flex-1 bg-gradient-to-r from-blue-600 to-indigo-600",
                "hover:from-blue-700 hover:to-indigo-700 text-white font-medium",
                "rounded-xl shadow-lg transition-all duration-300",
                "hover:shadow-xl hover:scale-105 backdrop-blur-sm",
                !canSend && "opacity-50 cursor-not-allowed hover:scale-100"
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

        {/* Input file oculto com múltipla seleção */}
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
