
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { KanbanTag } from '@/types/kanban';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const availableColors = [
    'bg-blue-400', 'bg-red-400', 'bg-green-400', 'bg-purple-400', 
    'bg-yellow-400', 'bg-amber-400', 'bg-emerald-400', 'bg-pink-400'
  ];

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      onCreateTag(newTagName.trim(), newTagColor);
      setNewTagName('');
      setNewTagColor('bg-blue-400');
      setIsCreating(false);
    }
  };

  const selectedTags = availableTags.filter(tag => selectedTagIds.includes(tag.id));

  return (
    <div className="space-y-3">
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="flex items-center gap-1"
          >
            <div className={cn("w-2 h-2 rounded-full", tag.color)} />
            {tag.name}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => onToggleTag(tag.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      {/* Add Tags */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tags Disponíveis</Label>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <div
                        key={tag.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted",
                          isSelected && "bg-muted"
                        )}
                        onClick={() => onToggleTag(tag.id)}
                      >
                        <div className={cn("w-3 h-3 rounded-full", tag.color)} />
                        <span className="text-sm">{tag.name}</span>
                        {isSelected && <X className="h-3 w-3 ml-auto" />}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Create New Tag */}
            <div className="border-t pt-4">
              {!isCreating ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Criar Nova Tag
                </Button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Nome da Tag</Label>
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Nome da tag"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Cor</Label>
                    <div className="flex gap-2 mt-1">
                      {availableColors.map((color) => (
                        <div
                          key={color}
                          className={cn(
                            "w-6 h-6 rounded-full cursor-pointer border-2",
                            color,
                            newTagColor === color ? "border-black" : "border-transparent"
                          )}
                          onClick={() => setNewTagColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateTag}>
                      Criar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsCreating(false)}
                    >
                      Cancelar
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
