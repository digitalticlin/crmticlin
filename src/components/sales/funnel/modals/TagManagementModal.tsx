
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTags?: any[];
  onTagsChange: () => Promise<void>;
}

export const TagManagementModal = ({ 
  isOpen, 
  onClose, 
  availableTags = [], 
  onTagsChange 
}: TagManagementModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Etiquetas</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Funcionalidade de gerenciamento de etiquetas em desenvolvimento.
          </p>
          
          {availableTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Etiquetas Disponíveis:</h4>
              <div className="space-y-1">
                {availableTags.map((tag, index) => (
                  <div key={index} className="text-xs text-gray-500">
                    {typeof tag === 'string' ? tag : tag.name || 'Tag sem nome'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
