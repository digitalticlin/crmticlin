import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { SpreadsheetDropzone } from "./SpreadsheetDropzone";
import { SpreadsheetPreview } from "./SpreadsheetPreview";
import { ImportProgress } from "./ImportProgress";
import { ImportResults } from "./ImportResults";
import { useSpreadsheetImport } from "@/hooks/clients/useSpreadsheetImport";

interface ImportSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportSpreadsheetModal = ({ isOpen, onClose }: ImportSpreadsheetModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const {
    isImporting,
    progress,
    result,
    handleImport,
    downloadTemplate,
    resetImport
  } = useSpreadsheetImport();

  const handleClose = () => {
    if (!isImporting) {
      setSelectedFile(null);
      resetImport();
      onClose();
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    resetImport();
  };

  const handleStartImport = () => {
    if (selectedFile) {
      handleImport(selectedFile);
    }
  };

  const handleNewImport = () => {
    setSelectedFile(null);
    resetImport();
  };

  const getDialogTitle = () => {
    if (result) return "Resultado da Importação";
    if (isImporting) return "Importando Clientes";
    if (selectedFile) return "Confirmar Importação";
    return "Importar Clientes";
  };

  const getDialogDescription = () => {
    if (result) return "Confira os resultados da importação";
    if (isImporting) return "Aguarde enquanto processamos sua planilha";
    if (selectedFile) return "Revise os dados antes de confirmar a importação";
    return "Faça upload de uma planilha CSV ou Excel para importar clientes em massa";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {getDialogTitle()}
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                {getDialogDescription()}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isImporting}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          {!selectedFile && !isImporting && !result && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-900">
                    Primeira vez importando?
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Baixe nosso template para garantir que sua planilha esteja no formato correto
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="bg-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Template
                </Button>
              </div>
            </div>
          )}

          {/* Step 1: File Upload */}
          {!selectedFile && !isImporting && !result && (
            <SpreadsheetDropzone onFileSelect={handleFileSelect} />
          )}

          {/* Step 2: Preview */}
          {selectedFile && !isImporting && !result && (
            <SpreadsheetPreview
              file={selectedFile}
              onConfirm={handleStartImport}
              onCancel={() => setSelectedFile(null)}
            />
          )}

          {/* Step 3: Progress */}
          {isImporting && progress && (
            <ImportProgress progress={progress} />
          )}

          {/* Step 4: Results */}
          {result && (
            <ImportResults
              result={result}
              onNewImport={handleNewImport}
              onClose={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};