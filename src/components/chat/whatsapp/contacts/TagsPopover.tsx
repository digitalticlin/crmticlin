
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { KanbanTag } from "@/types/kanban";
import { TagBadge } from "@/components/ui/tag-badge";

interface TagsPopoverProps {
  contactId: string;
  currentTags: KanbanTag[];
  onTagsChange: (contactId: string) => void;
}

export const TagsPopover = ({ contactId, currentTags, onTagsChange }: TagsPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-xs text-gray-500 hover:text-gray-700 px-1">
          Tags
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
            Etiquetas
          </h4>
          
          {currentTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentTags.map((tag) => (
                <TagBadge 
                  key={tag.id}
                  tag={tag}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">
              Nenhuma etiqueta encontrada para este contato.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
