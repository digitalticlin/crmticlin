
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ImportHistoryStatusProps {
  hasBeenImported: boolean;
  isImporting: boolean;
  lastImportDate?: string | null;
}

export const ImportHistoryStatus = ({ 
  hasBeenImported, 
  isImporting, 
  lastImportDate 
}: ImportHistoryStatusProps) => {
  if (isImporting) {
    return (
      <Badge variant="secondary" className="text-blue-600 bg-blue-100">
        <Clock className="h-3 w-3 mr-1" />
        Importando...
      </Badge>
    );
  }

  if (hasBeenImported) {
    return (
      <Badge variant="secondary" className="text-green-600 bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />
        Histórico Importado
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-gray-600">
      <AlertCircle className="h-3 w-3 mr-1" />
      Histórico Não Importado
    </Badge>
  );
};
