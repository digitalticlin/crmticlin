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
      toast.error('Máximo de 25 fotos por vez');
      return;
    }

    // Validar se todos são imagens
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

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Enviar todas as fotos em fila
  const handleSendAll = async () => {
    if (selectedFiles.length === 0) return;

    setIsSending(true);
    let successCount = 0;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        setCurrentProcessingIndex(i);
        const success = await sendFile(selectedFiles[i], ''); // Sem legenda
        if (success) {
          successCount++;
        }
        // Pequeno delay entre envios para não sobrecarregar
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

  // Remover foto específica
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Remover todas as fotos
  const handleRemoveAll = () => {
    setSelectedFiles([]);
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
            <div className="p-2 bg-green-100/80 backdrop-blur-sm rounded-xl">
              <ImageIcon className="h-5 w-5 text-green-600" />
            </div>
            Enviar Foto{selectedFiles.length > 1 ? 's' : ''}
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
              "border-2 border-dashed border-green-300/50 rounded-2xl p-8 text-center",
              "bg-gradient-to-br from-green-50/80 to-emerald-50/60 backdrop-blur-sm",
              "transition-all duration-300 hover:border-green-400/60 hover:bg-gradient-to-br hover:from-green-50/90 hover:to-emerald-50/80"
            )}>
              <div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl w-fit mx-auto mb-4">
                <ImageIcon className="h-12 w-12 text-green-600" />
              </div>
              <p className="text-gray-700 font-medium mb-2">
                Selecione fotos para enviar
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Máximo de 25 fotos por vez • Formatos: JPG, PNG, WEBP
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
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
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Escolher Fotos
                  </>
                )}
              </Button>
              
              {/* Progress Bar para processamento */}
              {isUploading && (
                <div className="mt-6 bg-white/70 backdrop-blur-sm rounded-xl p-4">
                  <Progress value={uploadProgress} className="w-full h-2 mb-2" />
                  <p className="text-sm text-gray-600 font-medium">
                    Processando foto {currentProcessingIndex + 1}... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Grid de Fotos Selecionadas */}
          {selectedFiles.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <div className={cn(
                "flex items-center justify-between mb-4 p-3 rounded-xl",
                "bg-gradient-to-r from-green-50/80 to-emerald-50/60 backdrop-blur-sm",
                "border border-green-200/30"
              )}>
                <span className="text-sm font-semibold text-gray-700">
                  {selectedFiles.length} foto{selectedFiles.length > 1 ? 's' : ''} selecionada{selectedFiles.length > 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedFiles.length >= 25 || isProcessing}
                    className={cn(
                      "bg-white/70 hover:bg-white/90 backdrop-blur-sm",
                      "border-green-200/50 text-green-700 hover:text-green-800",
                      "rounded-lg transition-all duration-200"
                    )}
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
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
                    Limpar Todas
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto pr-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className={cn(
                      "relative rounded-xl overflow-hidden aspect-square",
                      "bg-gradient-to-br from-gray-50/80 to-gray-100/60 backdrop-blur-sm",
                      "border border-white/30 shadow-md hover:shadow-lg",
                      "transition-all duration-300 hover:scale-105"
                    )}>
                      <img
                        src={file.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Indicador de processamento */}
                      {isSending && currentProcessingIndex === index && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                      
                      {/* Botão de remover */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        disabled={isProcessing}
                        className={cn(
                          "absolute top-2 right-2 h-6 w-6 p-0 rounded-full",
                          "bg-red-500/90 hover:bg-red-600 backdrop-blur-sm",
                          "opacity-0 group-hover:opacity-100 transition-all duration-200",
                          "shadow-lg border border-white/20"
                        )}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      
                      {/* Indicador de sucesso */}
                      {isSending && currentProcessingIndex > index && (
                        <div className="absolute top-2 left-2 bg-green-500/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 mt-2 truncate font-medium">
                      {file.name}
                    </p>
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
                  Enviando foto {currentProcessingIndex + 1} de {selectedFiles.length}
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
                "flex-1 bg-gradient-to-r from-green-600 to-emerald-600",
                "hover:from-green-700 hover:to-emerald-700 text-white font-medium",
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
                  Enviar {selectedFiles.length} Foto{selectedFiles.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Input file oculto com múltipla seleção */}
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
