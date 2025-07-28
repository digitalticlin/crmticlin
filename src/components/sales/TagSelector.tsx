
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { KanbanTag } from '@/types/kanban';
import { TagColorSelector } from './tags/TagColorSelector';
import { TagBadge } from '@/components/ui/tag-badge';

interface TagSelectorProps {
  availableTags: KanbanTag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string, color: string) => void;
}

export const TagSelector = ({
  availableTags,
  selectedTagIds,
  onToggleTag,
  onCreateTag
}: TagSelectorProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('bg-blue-400');

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      onCreateTag(newTagName.trim(), newTagColor);
      setNewTagName('');
      setNewTagColor('bg-blue-400');
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Tags selecionadas */}
      <div className="flex flex-wrap gap-1">
        {availableTags
          .filter(tag => selectedTagIds.includes(tag.id))
          .map(tag => (
            <TagBadge
              key={tag.id}
              tag={tag}
              showRemoveIcon
              onClick={() => onToggleTag(tag.id)}
            />
          ))}
      </div>

      {/* Adicionar nova tag */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-3 w-3" />
            Adicionar Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Gerenciar Tags</h4>
            
            {/* Lista de tags disponíveis */}
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground">
                Tags disponíveis
              </h5>
              <div className="flex flex-wrap gap-1">
                {availableTags.map(tag => (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    onClick={() => onToggleTag(tag.id)}
                    className={
                      selectedTagIds.includes(tag.id) 
                        ? 'ring-2 ring-blue-500' 
                        : 'cursor-pointer hover:opacity-80'
                    }
                  />
                ))}
              </div>
            </div>

            {/* Criar nova tag */}
            <div className="space-y-2 border-t pt-3">
              {!isCreating ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(true)}
                  className="w-full gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Criar Nova Tag
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Nome da tag"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="text-sm"
                  />
                  <TagColorSelector
                    selectedColor={newTagColor}
                    onSelectColor={setNewTagColor}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim()}
                    >
                      Criar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsCreating(false);
                        setNewTagName('');
                        setNewTagColor('bg-blue-400');
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
