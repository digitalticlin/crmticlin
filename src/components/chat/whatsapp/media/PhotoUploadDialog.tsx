
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ImageIcon, X, Send, Loader2, Check } from 'lucide-react';
import { useMediaUpload, type UploadedFile } from '@/hooks/whatsapp/chat/useMediaUpload';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PhotoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
}

export const PhotoUploadDialog: React.FC<PhotoUploadDialogProps> = ({
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
      toast.error('Máximo de 25 fotos por vez');
      return;
    }

    const nonImageFiles = files.filter(file => !file.type.startsWith('image/'));
    if (nonImageFiles.length > 0) {
      toast.error('Apenas imagens são permitidas');
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
        toast.success(`${successCount} foto${successCount > 1 ? 's' : ''} enviada${successCount > 1 ? 's' : ''} com sucesso!`);
        handleClose();
      } else {
        toast.warning(`${successCount} de ${selectedFiles.length} fotos enviadas`);
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
            <ImageIcon className="h-5 w-5 text-gray-600" />
            Enviar Foto{selectedFiles.length > 1 ? 's' : ''}
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
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2 font-medium">
                Selecione fotos para enviar
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Máximo de 25 fotos por vez • JPG, PNG, WEBP
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
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Escolher Fotos
                  </>
                )}
              </Button>
              
              {isUploading && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-gray-500 mt-2">
                    Processando foto {currentProcessingIndex + 1}... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Grid de Fotos Selecionadas */}
          {selectedFiles.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  {selectedFiles.length} foto{selectedFiles.length > 1 ? 's' : ''} selecionada{selectedFiles.length > 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedFiles.length >= 25 || isProcessing}
                    className="backdrop-blur-sm bg-white/50 border-gray-200"
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
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
                    Limpar Todas
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className={cn(
                      "relative rounded-xl overflow-hidden aspect-square",
                      "bg-white/30 backdrop-blur-sm border border-gray-200/30"
                    )}>
                      <img
                        src={file.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Indicador de processamento */}
                      {isSending && currentProcessingIndex === index && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        disabled={isProcessing}
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      
                      {isSending && currentProcessingIndex > index && (
                        <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {file.name}
                    </p>
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
                  Enviando foto {currentProcessingIndex + 1} de {selectedFiles.length}
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
                  Enviar {selectedFiles.length} Foto{selectedFiles.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};
