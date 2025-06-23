
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Import, Loader2, CheckCircle } from 'lucide-react';
import { ImportHistoryModal } from './ImportHistoryModal';
import { useImportHistoryStatus } from '@/hooks/whatsapp/useImportHistoryStatus';

interface ImportHistoryButtonProps {
  instanceId: string;
  instanceName: string;
  connectionStatus: string;
}

export const ImportHistoryButton = ({ 
  instanceId, 
  instanceName, 
  connectionStatus 
}: ImportHistoryButtonProps) => {
  const [showModal, setShowModal] = useState(false);
  const { isImporting, hasBeenImported, startImport } = useImportHistoryStatus(instanceId);

  // Só mostrar para instâncias conectadas
  const isConnected = ['ready', 'connected', 'open'].includes(connectionStatus?.toLowerCase() || '');
  
  if (!isConnected) {
    return null;
  }

  const handleImportClick = () => {
    if (hasBeenImported) {
      // Se já foi importado, perguntar se quer importar novamente
      setShowModal(true);
    } else {
      // Se nunca foi importado, abrir modal
      setShowModal(true);
    }
  };

  const handleConfirmImport = async () => {
    setShowModal(false);
    await startImport();
  };

  return (
    <>
      <Button
        variant={hasBeenImported ? "outline" : "default"}
        size="sm"
        onClick={handleImportClick}
        disabled={isImporting}
        className={`flex items-center gap-2 ${
          hasBeenImported 
            ? 'text-green-600 border-green-200 hover:bg-green-50' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isImporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : hasBeenImported ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <Import className="h-4 w-4" />
        )}
        
        {isImporting 
          ? 'Importando...' 
          : hasBeenImported 
            ? 'Reimportar' 
            : 'Importar Histórico'
        }
      </Button>

      <ImportHistoryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmImport}
        instanceName={instanceName}
        hasBeenImported={hasBeenImported}
        isImporting={isImporting}
      />
    </>
  );
};
