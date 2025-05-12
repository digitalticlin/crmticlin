
import { KanbanLead, KanbanTag } from "@/types/kanban";
import { MessageSquare, Tag, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

interface LeadDetailSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLead: KanbanLead | null;
  availableTags: KanbanTag[];
  onToggleTag: (tagId: string) => void;
  onUpdateNotes: (notes: string) => void;
}

export const LeadDetailSidebar = ({
  isOpen,
  onOpenChange,
  selectedLead,
  availableTags,
  onToggleTag,
  onUpdateNotes,
}: LeadDetailSidebarProps) => {
  if (!selectedLead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold">{selectedLead.name}</SheetTitle>
          <SheetDescription>{selectedLead.phone}</SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Tags */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Tag className="h-4 w-4 mr-1" /> Etiquetas
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => (
                <Badge 
                  key={tag.id} 
                  className={cn(
                    "cursor-pointer text-black",
                    selectedLead.tags.some(t => t.id === tag.id) ? tag.color : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300"
                  )}
                  onClick={() => onToggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <h3 className="text-sm font-medium mb-2">Observações</h3>
            <Textarea 
              placeholder="Adicione notas sobre este lead"
              value={selectedLead.notes || ""}
              onChange={(e) => onUpdateNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          {/* Chat Preview */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" /> Conversa
            </h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium">{selectedLead.lastMessageTime}</span>
                <span className="text-xs text-muted-foreground">WhatsApp</span>
              </div>
              <p className="text-sm">{selectedLead.lastMessage}</p>
            </div>
            
            <Button 
              className="w-full mt-2 bg-ticlin hover:bg-ticlin/90 text-black"
              onClick={() => {
                onOpenChange(false);
                // In a real app, this would navigate to the chat page with this contact
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Abrir Chat Completo
            </Button>
          </div>
        </div>
        
        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
            <Save className="h-4 w-4 mr-2" />
            Salvar Contato
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
