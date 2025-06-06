
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";

interface DocumentSelectorProps {
  documentType?: 'cpf' | 'cnpj';
  documentId?: string;
  onDocumentTypeChange: (type: 'cpf' | 'cnpj') => void;
  onDocumentIdChange: (id: string) => void;
  disabled?: boolean;
}

export const DocumentSelector = ({ 
  documentType, 
  documentId, 
  onDocumentTypeChange, 
  onDocumentIdChange, 
  disabled 
}: DocumentSelectorProps) => {
  const formatDocument = (value: string, type: 'cpf' | 'cnpj') => {
    const numbers = value.replace(/\D/g, '');
    
    if (type === 'cpf') {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    } else {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    }
  };

  const handleDocumentChange = (value: string) => {
    if (documentType) {
      const formatted = formatDocument(value, documentType);
      onDocumentIdChange(formatted);
    } else {
      onDocumentIdChange(value);
    }
  };

  const getPlaceholder = () => {
    if (!documentType) return 'Selecione o tipo primeiro';
    return documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00';
  };

  const getMaxLength = () => {
    if (!documentType) return undefined;
    return documentType === 'cpf' ? 14 : 18;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="document_type" className="text-gray-700 font-medium">Tipo de Documento</Label>
        <div className="relative">
          <Select value={documentType} onValueChange={onDocumentTypeChange} disabled={disabled}>
            <SelectTrigger className="border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpf">CPF - Pessoa Física</SelectItem>
              <SelectItem value="cnpj">CNPJ - Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
          <FileText className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="document_id" className="text-gray-700 font-medium">
          {documentType === 'cpf' ? 'CPF' : documentType === 'cnpj' ? 'CNPJ' : 'Documento'}
        </Label>
        <Input
          id="document_id"
          name="document_id"
          value={documentId || ''}
          onChange={(e) => handleDocumentChange(e.target.value)}
          placeholder={getPlaceholder()}
          maxLength={getMaxLength()}
          disabled={disabled || !documentType}
          className="border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white"
        />
      </div>
    </div>
  );
};
