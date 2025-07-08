
import { useState } from "react";
import { KanbanTag } from "@/types/kanban";
import { TagChip } from "./TagChip";
import { QuickTagCreator } from "./QuickTagCreator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface SimplifiedTagModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tags: KanbanTag[];
  onCreateTag: (name: string, color: string) => void;
  onUpdateTag: (id: string, name: string, color: string) => void;
  onDeleteTag: (id: string) => void;
}

export const SimplifiedTagModal = ({
  isOpen,
  onOpenChange,
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag
}: SimplifiedTagModalProps) => {
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleEditTag = (tagId: string, name: string, color: string) => {
    onUpdateTag(tagId, name, color);
    setEditingTagId(null);
    toast.success("Etiqueta atualizada!");
  };

  const handleDeleteTag = (tagId: string) => {
    onDeleteTag(tagId);
    toast.success("Etiqueta removida!");
  };

  const handleCreateTag = (name: string, color: string) => {
    onCreateTag(name, color);
    toast.success("Etiqueta criada!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[500px] bg-black/30 backdrop-blur-xl border-white/20">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            🏷️ Suas Etiquetas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-[350px] overflow-y-auto">
          {/* Tags Existentes */}
          {tags.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/80">Etiquetas ({tags.length})</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <TagChip
                    key={tag.id}
                    tag={tag}
                    onEdit={handleEditTag}
                    onDelete={handleDeleteTag}
                    isEditing={editingTagId === tag.id}
                    onStartEdit={() => setEditingTagId(tag.id)}
                    onCancelEdit={() => setEditingTagId(null)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🏷️</div>
              <p className="text-white/60 text-sm">
                Ainda não há etiquetas criadas.
                <br />
                Crie sua primeira etiqueta abaixo!
              </p>
            </div>
          )}

          {/* Criador de Tags */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80">Nova Etiqueta</h3>
            <QuickTagCreator
              onCreateTag={handleCreateTag}
              isCreating={isCreating}
              setIsCreating={setIsCreating}
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-white/50 text-center">
            💡 Dica: Passe o mouse sobre uma etiqueta para editá-la ou excluí-la
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
