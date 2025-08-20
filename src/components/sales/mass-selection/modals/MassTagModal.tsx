import { useState, useEffect } from "react";
import { KanbanLead, KanbanTag } from "@/types/kanban";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tag, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  MassActionsService, 
  TagOption 
} from "@/services/massActions/massActionsService";

interface MassTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: KanbanLead[];
  onSuccess: () => void;
}

interface TagWithAction extends TagOption {
  action: 'add' | 'remove' | null;
}

export const MassTagModal = ({
  isOpen,
  onClose,
  selectedLeads,
  onSuccess
}: MassTagModalProps) => {
  const [isApplying, setIsApplying] = useState(false);
  const [availableTags, setAvailableTags] = useState<TagWithAction[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedCount = selectedLeads.length;

  // Carregar tags disponíveis
  useEffect(() => {
    const loadTags = async () => {
      if (!isOpen) return;

      setLoading(true);
      try {
        const tagOptions = await MassActionsService.getTags();
        const tagsWithActions: TagWithAction[] = tagOptions.map(tag => ({
          ...tag,
          action: null
        }));

        setAvailableTags(tagsWithActions);
      } catch (error) {
        console.error('Erro ao carregar tags:', error);
        toast.error('Erro ao carregar tags disponíveis');
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, [isOpen]);

  const handleTagAction = (tagId: string, newAction: 'add' | 'remove' | null) => {
    setAvailableTags(prev => 
      prev.map(tag => 
        tag.id === tagId 
          ? { ...tag, action: newAction } 
          : tag
      )
    );
  };

  const handleApply = async () => {
    const tagsToAdd = availableTags.filter(tag => tag.action === 'add');
    const tagsToRemove = availableTags.filter(tag => tag.action === 'remove');

    if (tagsToAdd.length === 0 && tagsToRemove.length === 0) {
      toast.error('Selecione pelo menos uma ação para as tags');
      return;
    }

    setIsApplying(true);
    
    try {
      const leadIds = selectedLeads.map(lead => lead.id);
      let addResult = null;
      let removeResult = null;

      // Remover tags
      if (tagsToRemove.length > 0) {
        const tagIdsToRemove = tagsToRemove.map(tag => tag.id);
        removeResult = await MassActionsService.removeTagsFromLeads(leadIds, tagIdsToRemove);
        if (!removeResult.success) {
          toast.error(removeResult.message);
          return;
        }
      }

      // Adicionar tags
      if (tagsToAdd.length > 0) {
        const tagIdsToAdd = tagsToAdd.map(tag => tag.id);
        addResult = await MassActionsService.addTagsToLeads(leadIds, tagIdsToAdd);
        if (!addResult.success) {
          toast.error(addResult.message);
          return;
        }
      }

      // Mostrar resultado consolidado
      const actionSummary = [];
      if (tagsToAdd.length > 0) {
        actionSummary.push(`${tagsToAdd.length} tag(s) adicionada(s)`);
      }
      if (tagsToRemove.length > 0) {
        actionSummary.push(`${tagsToRemove.length} tag(s) removida(s)`);
      }

      toast.success(
        `Tags atualizadas em ${selectedCount} lead${selectedCount > 1 ? 's' : ''}! ${actionSummary.join(', ')}`
      );
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao aplicar tags:', error);
      toast.error('Erro inesperado ao aplicar tags');
    } finally {
      setIsApplying(false);
    }
  };

  const handleClose = () => {
    setAvailableTags(prev => prev.map(tag => ({ ...tag, action: null })));
    onClose();
  };

  const hasChanges = availableTags.some(tag => tag.action !== null);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <Tag size={20} />
            Gerenciar Tags dos Leads
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-700 mb-4">
            Aplicando tags em{' '}
            <strong className="text-green-600">{selectedCount}</strong>{' '}
            lead{selectedCount > 1 ? 's' : ''} selecionado{selectedCount > 1 ? 's' : ''}
          </p>

          <div>
            <Label className="text-sm font-medium mb-3 block">
              Tags Disponíveis
            </Label>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableTags.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Nenhuma tag disponível
                  </p>
                ) : (
                  availableTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
                    >
                      <Badge
                        style={{ backgroundColor: tag.color }}
                        className="text-white"
                      >
                        {tag.name}
                      </Badge>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTagAction(tag.id, tag.action === 'add' ? null : 'add')}
                          className={cn(
                            "p-1 h-7 w-7",
                            tag.action === 'add' && "bg-green-100 text-green-600"
                          )}
                        >
                          <Plus size={14} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTagAction(tag.id, tag.action === 'remove' ? null : 'remove')}
                          className={cn(
                            "p-1 h-7 w-7",
                            tag.action === 'remove' && "bg-red-100 text-red-600"
                          )}
                        >
                          <Minus size={14} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {hasChanges && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700">
                  <strong>Ações selecionadas:</strong>
                  <ul className="mt-1 space-y-1">
                    {availableTags
                      .filter(tag => tag.action === 'add')
                      .map(tag => (
                        <li key={`add-${tag.id}`} className="flex items-center gap-2">
                          <Plus size={12} className="text-green-600" />
                          Adicionar "{tag.name}"
                        </li>
                      ))}
                    {availableTags
                      .filter(tag => tag.action === 'remove')
                      .map(tag => (
                        <li key={`remove-${tag.id}`} className="flex items-center gap-2">
                          <Minus size={12} className="text-red-600" />
                          Remover "{tag.name}"
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isApplying}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleApply}
            disabled={isApplying || !hasChanges}
            className="flex items-center gap-2"
          >
            {isApplying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Aplicando...
              </>
            ) : (
              <>
                <Tag size={16} />
                Aplicar Mudanças
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};