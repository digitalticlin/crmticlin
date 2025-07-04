import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { KanbanTag } from "@/types/kanban";
import { cn } from "@/lib/utils";

interface TagListProps {
  tags: KanbanTag[];
  selectedTags: KanbanTag[];
  onToggleTag: (tagId: string) => void;
  onCreateTag?: (name: string, color: string) => void;
}

export const TagList = ({
  tags,
  selectedTags,
  onToggleTag,
  onCreateTag
}: TagListProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1"); // Cor padrão indigo-500

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    onCreateTag?.(newTagName.trim(), newTagColor);
    setNewTagName("");
    setIsCreating(false);
  };

  return (
    <div className="space-y-2">
      {/* Lista de Tags Existentes */}
      <div className="space-y-1">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className={cn(
              "flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer",
              "transition-colors duration-200",
              "hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            onClick={() => onToggleTag(tag.id)}
          >
            <span className="text-sm">{tag.name}</span>
            {selectedTags.some(t => t.id === tag.id) && (
              <Check className="h-4 w-4 text-green-500" />
            )}
          </div>
        ))}
      </div>

      {/* Formulário de Nova Tag */}
      {onCreateTag && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          {isCreating ? (
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Nome da tag"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="h-8"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-8 w-8 p-0 cursor-pointer"
                />
                <Button
                  size="sm"
                  className="flex-1 h-8"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                >
                  Criar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => setIsCreating(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Tag
            </Button>
          )}
        </div>
      )}
    </div>
  );
}; 