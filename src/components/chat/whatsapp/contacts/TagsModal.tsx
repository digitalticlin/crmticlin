
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { unifiedTags } from "@/data/unifiedFakeData";
import { getTagStyleClasses } from "@/utils/tagColors";

interface TagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  tags: string[];
}

export const TagsModal = ({ isOpen, onClose, contactName, tags }: TagsModalProps) => {
  // Função para obter cor da tag sincronizada com o funil
  const getTagColor = (tagName: string) => {
    const unifiedTag = unifiedTags.find(tag => tag.name === tagName);
    if (unifiedTag) {
      return getTagStyleClasses(unifiedTag.color);
    }
    return getTagStyleClasses('bg-gray-400');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 font-semibold">
            Etiquetas - {contactName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className={cn(
                    "text-sm font-semibold backdrop-blur-[2px] shadow-md",
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
      </DialogContent>
    </Dialog>
  );
};
