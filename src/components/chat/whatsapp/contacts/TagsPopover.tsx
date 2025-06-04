
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { unifiedTags } from "@/data/unifiedFakeData";
import { getTagStyleClasses } from "@/utils/tagColors";

interface TagsPopoverProps {
  contactName: string;
  tags: string[];
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TagsPopover = ({ contactName, tags, children, open, onOpenChange }: TagsPopoverProps) => {
  // Função para obter cor da tag sincronizada com o funil
  const getTagColor = (tagName: string) => {
    const unifiedTag = unifiedTags.find(tag => tag.name === tagName);
    if (unifiedTag) {
      return getTagStyleClasses(unifiedTag.color);
    }
    return getTagStyleClasses('bg-gray-400');
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 bg-white border border-gray-200 shadow-lg rounded-lg p-4"
        side="bottom"
        align="start"
        sideOffset={4}
      >
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">
            Etiquetas - {contactName}
          </h4>
          
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className={cn(
                    "text-sm font-semibold",
                    getTagColor(tag)
                  )}
                >
                  {tag}
                </Badge>
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
