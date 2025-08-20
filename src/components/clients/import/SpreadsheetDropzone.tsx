import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SpreadsheetDropzoneProps {
  onFileSelect: (file: File) => void;
}

export const SpreadsheetDropzone = ({ onFileSelect }: SpreadsheetDropzoneProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const hasRejections = fileRejections.length > 0;

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : hasRejections
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {isDragActive ? (
            <>
              <Upload className="h-12 w-12 text-blue-500" />
              <p className="text-blue-700 font-medium">Solte o arquivo aqui...</p>
            </>
          ) : hasRejections ? (
            <>
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p className="text-red-700 font-medium">Arquivo inválido</p>
              <p className="text-sm text-red-600">
                {fileRejections[0]?.errors[0]?.message}
              </p>
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-gray-700 font-medium mb-1">
                  Arraste sua planilha aqui ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500">
                  Formatos aceitos: CSV, XLSX, XLS (máx. 10MB)
                </p>
              </div>
              <Button type="button" variant="outline" className="mt-2">
                Selecionar Arquivo
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Format Requirements */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">
          Formato Obrigatório da Planilha:
        </h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <p><strong>Campos obrigatórios:</strong> Nome, Telefone</p>
          <p><strong>Campos opcionais:</strong> Email, Empresa, Documento, Endereço, Bairro, Cidade, Estado, CEP, País, Observações, Tags</p>
          <p><strong>Tags:</strong> Separadas por vírgula (ex: VIP,Corporativo,Cliente)</p>
          <p><strong>Máximo:</strong> 1000 registros por importação</p>
        </div>
      </div>

      {/* Column Order */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          Ordem das Colunas (recomendada):
        </h4>
        <div className="text-sm text-blue-700 grid grid-cols-2 md:grid-cols-4 gap-2">
          <span>1. Nome*</span>
          <span>2. Telefone*</span>
          <span>3. Email</span>
          <span>4. Empresa</span>
          <span>5. Documento</span>
          <span>6. Endereço</span>
          <span>7. Bairro</span>
          <span>8. Cidade</span>
          <span>9. Estado</span>
          <span>10. CEP</span>
          <span>11. País</span>
          <span>12. Observações</span>
          <span>13. Tags</span>
        </div>
      </div>
    </div>
  );
};