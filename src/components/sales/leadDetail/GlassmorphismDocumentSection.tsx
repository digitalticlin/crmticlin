
import { FileText, Building2 } from "lucide-react";

interface GlassmorphismDocumentSectionProps {
  documentType?: 'cpf' | 'cnpj';
  documentId?: string;
  company?: string;
}

export const GlassmorphismDocumentSection = ({
  documentType,
  documentId,
  company
}: GlassmorphismDocumentSectionProps) => {
  if (!documentType && !documentId && !company) return null;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-lime-400 rounded-full shadow-lg shadow-lime-400/50"></div>
        Dados Empresariais
      </h3>
      
      <div className="space-y-4">
        {company && (
          <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <Building2 className="h-4 w-4 text-lime-400" />
            <div className="flex-1">
              <span className="text-sm font-medium text-lime-300 block">Empresa</span>
              <span className="text-white font-medium">{company}</span>
            </div>
          </div>
        )}
        
        {documentType && documentId && (
          <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <FileText className="h-4 w-4 text-lime-400" />
            <div className="flex-1">
              <span className="text-sm font-medium text-lime-300 block">
                {documentType === 'cpf' ? 'CPF' : 'CNPJ'}
              </span>
              <span className="text-white font-medium">{documentId}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
