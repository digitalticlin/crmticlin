
import { KanbanLead, KanbanTag } from "@/types/kanban";
import { MessageSquare, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { TagSelector } from "./TagSelector";

interface LeadDetailSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLead: KanbanLead | null;
  availableTags: KanbanTag[];
  onToggleTag: (tagId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onCreateTag?: (name: string, color: string) => void;
}

export const LeadDetailSidebar = ({
  isOpen,
  onOpenChange,
  selectedLead,
  availableTags,
  onToggleTag,
  onUpdateNotes,
  onCreateTag,
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
          {/* Tags Selector */}
          <TagSelector
            availableTags={availableTags}
            selectedTags={selectedLead.tags}
            onToggleTag={onToggleTag}
            onCreateTag={onCreateTag}
          />
          
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
