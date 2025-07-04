import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TagList } from "@/components/ui/tag-list";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { TagBadge } from "@/components/ui/tag-badge";
import { KanbanTag } from "@/types/kanban";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TagsSectionProps {
  leadTags: KanbanTag[];
  availableTags: KanbanTag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  onTagsChange: () => void;
  isLoading?: boolean;
}

export const TagsSection = ({
  leadTags,
  availableTags,
  onAddTag,
  onRemoveTag,
  onTagsChange,
  isLoading = false
}: TagsSectionProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleTag = (tagId: string) => {
    if (leadTags.some(tag => tag.id === tagId)) {
      onRemoveTag(tagId);
    } else {
      onAddTag(tagId);
    }
    setIsOpen(false);
  };

  const handleCreateTag = async (name: string, color: string) => {
    try {
      if (!user?.id) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { data: newTag, error: createError } = await supabase
        .from('tags')
        .insert([{
          name,
          color,
          created_by_user_id: user.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) throw createError;

      onTagsChange();

      if (newTag) {
        onAddTag(newTag.id);
      }

      toast.success("Tag criada com sucesso!");
    } catch (error: any) {
      console.error("Erro ao criar tag:", error);
      toast.error("Erro ao criar tag");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Tags</h3>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="end">
            <TagList
              tags={availableTags}
              selectedTags={leadTags}
              onToggleTag={handleToggleTag}
              onCreateTag={handleCreateTag}
            />
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-2">
          <LoadingSpinner size="sm" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {leadTags.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              onClick={() => onRemoveTag(tag.id)}
              showRemoveIcon
            />
          ))}
          {leadTags.length === 0 && (
            <p className="text-sm text-gray-500">Nenhuma tag adicionada</p>
          )}
        </div>
      )}
    </div>
  );
}; 