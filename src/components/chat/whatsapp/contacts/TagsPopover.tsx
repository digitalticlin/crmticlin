
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { KanbanTag } from "@/types/kanban";
import { TagBadge } from "@/components/ui/tag-badge";
import { useLeadTags } from "@/hooks/salesFunnel/useLeadTags";
import { Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TagsPopoverProps {
  currentTags: KanbanTag[];
  leadId?: string; // ✅ ADICIONAR leadId para funcionalidade
  onTagsChange: () => void;
}

export const TagsPopover = ({ currentTags, leadId, onTagsChange }: TagsPopoverProps) => {
  const { availableTags, addTag, removeTag, loading } = useLeadTags(leadId || '');

  const handleToggleTag = async (tagId: string) => {
    const isTagSelected = currentTags.some(tag => tag.id === tagId);
    
    if (isTagSelected) {
      await removeTag(tagId);
    } else {
      await addTag(tagId);
    }
    
    onTagsChange(); // Notificar mudança
  };

  if (!leadId) {
    return (
      <button className="text-xs text-gray-400 px-1 cursor-not-allowed">
        Tags
      </button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-xs text-gray-500 hover:text-gray-700 px-1 flex items-center gap-1">
          <Tag className="h-3 w-3" />
          <span className="hidden sm:inline">Tags</span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 bg-white border border-gray-200 shadow-lg rounded-lg p-4"
        side="bottom"
        align="start"
        sideOffset={4}
      >
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">
            Gerenciar Etiquetas
          </h4>
          
          {/* Tags atuais */}
          {currentTags.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-2">Tags atuais:</p>
              <div className="flex flex-wrap gap-2">
                {currentTags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-1">
                    <TagBadge tag={tag} size="sm" />
                    <button
                      onClick={() => handleToggleTag(tag.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Tags disponíveis */}
          <div>
            <p className="text-xs text-gray-600 mb-2">Adicionar tags:</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {availableTags
                .filter(tag => !currentTags.some(ct => ct.id === tag.id))
                .map((tag) => (
                  <Button
                    key={tag.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleTag(tag.id)}
                    disabled={loading}
                    className="w-full justify-start p-2 h-auto"
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    <TagBadge tag={tag} size="sm" />
                  </Button>
                ))}
            </div>
          </div>
          
          {availableTags.length === 0 && (
            <p className="text-gray-600 text-sm">
              Nenhuma tag disponível.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
