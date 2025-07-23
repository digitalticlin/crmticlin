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

  // Resetar estado ao fechar
  const handleClose = () => {
    setSelectedFiles([]);
    setIsSending(false);
    setCurrentProcessingIndex(-1);
    onOpenChange(false);
  };

  // Selecionar múltiplos arquivos
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Limitar a 25 arquivos
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

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Enviar todos os arquivos em fila
  const handleSendAll = async () => {
    if (selectedFiles.length === 0) return;

    setIsSending(true);
    let successCount = 0;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        setCurrentProcessingIndex(i);
        const success = await sendFile(selectedFiles[i], ''); // Sem descrição
        if (success) {
          successCount++;
        }
        // Pequeno delay entre envios para não sobrecarregar
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

  // Remover arquivo específico
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Remover todos os arquivos
  const handleRemoveAll = () => {
    setSelectedFiles([]);
  };

  // Ícone baseado no tipo de arquivo
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

  // Nome amigável do tipo
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileIcon className="h-5 w-5" />
            Enviar Arquivo{selectedFiles.length > 1 ? 's' : ''}
            {selectedFiles.length > 0 && (
              <span className="text-sm text-gray-500">({selectedFiles.length}/25)</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Área de Upload */}
          {selectedFiles.length === 0 && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                Selecione arquivos para enviar
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Suporta: Documentos, Vídeos, Áudios (máx. 25 arquivos, 50MB cada)
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-green-600 hover:bg-green-700"
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
                  >
                    <FileIcon className="h-4 w-4 mr-1" />
                    Adicionar Mais
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAll}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar Todos
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 relative">
                    <div className="flex items-start gap-3">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {file.name}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <span>{getFileTypeName(file.type)}</span>
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
                          <div className="bg-green-500 rounded-full p-1">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          disabled={isProcessing}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Preview especial para vídeo */}
                    {file.type === 'video' && (
                      <div className="mt-3">
                        <video 
                          src={file.url} 
                          className="w-full h-32 object-cover rounded bg-gray-100"
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
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
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
              className="flex-1"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendAll}
              disabled={!canSend}
              className={cn(
                "flex-1 bg-green-600 hover:bg-green-700",
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