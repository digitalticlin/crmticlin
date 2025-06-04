
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { unifiedTags } from "@/data/unifiedFakeData";
import { getTagStyleClasses } from "@/utils/tagColors";

interface FilterTagsSubmenuProps {
  onBack: () => void;
  onItemClick: (value: string) => void;
}

export const FilterTagsSubmenu = ({ onBack, onItemClick }: FilterTagsSubmenuProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-1 h-6 w-6 rounded-full hover:bg-white/30"
          onClick={onBack}
        >
          ‹
        </Button>
        <h4 className="text-sm font-medium text-gray-700">Etiquetas</h4>
      </div>
      
      <ScrollArea className="h-48">
        <div className="grid gap-0.5 pr-3">
          {unifiedTags.map((tag) => (
            <Button 
              key={tag.id}
              variant="ghost" 
              size="sm" 
              className="justify-start text-gray-700 hover:bg-white/30 hover:text-gray-900 rounded-xl transition-all duration-200 h-auto py-1.5 px-2"
              onClick={() => onItemClick(`tag-${tag.id}`)}
            >
              <Badge 
                className={cn(
                  "text-xs mr-2 font-semibold",
                  getTagStyleClasses(tag.color)
                )}
              >
                {tag.name}
              </Badge>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
