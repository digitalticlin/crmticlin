
import { KanbanLead, KanbanTag } from "@/types/kanban";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import { TagSelector } from "./TagSelector";
import { LeadDetailHeader } from "./leadDetail/LeadDetailHeader";
import { PurchaseValueField } from "./leadDetail/PurchaseValueField";
import { AssignedUserField } from "./leadDetail/AssignedUserField";
import { NotesField } from "./leadDetail/NotesField";
import { ChatPreview } from "./leadDetail/ChatPreview";
import { LeadDetailFooter } from "./leadDetail/LeadDetailFooter";
import { GlassmorphismDealHistory } from "./leadDetail/GlassmorphismDealHistory";
import { EnhancedBasicInfoSection } from "./leadDetail/EnhancedBasicInfoSection";
import { useLeadDeals } from "@/hooks/salesFunnel/useLeadDeals";
import { useEffect } from "react";

interface LeadDetailSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLead: KanbanLead | null;
  availableTags: KanbanTag[];
  onToggleTag: (tagId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdatePurchaseValue?: (purchaseValue: number | undefined) => void;
  onUpdateAssignedUser?: (assignedUser: string) => void;
  onUpdateName?: (name: string) => void;
  onCreateTag?: (name: string, color: string) => void;
}

export const LeadDetailSidebar = ({
  isOpen,
  onOpenChange,
  selectedLead,
  availableTags,
  onToggleTag,
  onUpdateNotes,
  onUpdatePurchaseValue,
  onUpdateAssignedUser,
  onUpdateName,
  onCreateTag,
}: LeadDetailSidebarProps) => {
  const { data: deals = [], refetch: refetchDeals } = useLeadDeals(selectedLead?.id);

  // Refetch deals when lead changes
  useEffect(() => {
    if (selectedLead?.id) {
      refetchDeals();
    }
  }, [selectedLead?.id, refetchDeals]);

  const handleOpenChat = () => {
    onOpenChange(false);
    // In a real app, this would navigate to the chat page with this contact
  };

  // Handle name updates
  const handleNameUpdate = (name: string) => {
    if (onUpdateName) {
      onUpdateName(name);
      toast.success("Nome do lead atualizado");
    }
  };

  if (!selectedLead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white/40 backdrop-blur-lg border-white/30 shadow-2xl">
        <SheetHeader className="bg-white/60 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/40 shadow-lg">
          <LeadDetailHeader 
            selectedLead={selectedLead}
            onUpdateName={handleNameUpdate}
          />
        </SheetHeader>
        
        <div className="space-y-6">
          {/* Enhanced Basic Info Section */}
          <EnhancedBasicInfoSection 
            selectedLead={selectedLead}
            onUpdateLead={(updates) => {
              // Handle all basic info updates here
              console.log("Updating lead basic info:", updates);
            }}
          />
          
          {/* Purchase Value Field */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-white/40 shadow-lg">
            <PurchaseValueField 
              purchaseValue={selectedLead.purchaseValue}
              onUpdatePurchaseValue={onUpdatePurchaseValue ? 
                (value) => {
                  onUpdatePurchaseValue(value);
                  toast.success("Valor de compra atualizado");
                } : undefined}
            />
          </div>
          
          {/* Assigned User Field */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-white/40 shadow-lg">
            <AssignedUserField 
              assignedUser={selectedLead.assignedUser}
              onUpdateAssignedUser={onUpdateAssignedUser ? 
                (user) => {
                  onUpdateAssignedUser(user);
                  toast.success("Responsável atualizado");
                } : undefined}
            />
          </div>
          
          {/* Tags Selector */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-white/40 shadow-lg">
            <TagSelector
              availableTags={availableTags}
              selectedTags={selectedLead.tags}
              onToggleTag={onToggleTag}
              onCreateTag={onCreateTag}
            />
          </div>

          {/* Deal History */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-white/40 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Histórico de Negociações</h3>
            <GlassmorphismDealHistory deals={deals} />
          </div>
          
          {/* Notes Field */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-white/40 shadow-lg">
            <NotesField 
              notes={selectedLead.notes}
              onUpdateNotes={onUpdateNotes}
            />
          </div>
          
          {/* Chat Preview */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-white/40 shadow-lg">
            <ChatPreview 
              lastMessage={selectedLead.lastMessage}
              lastMessageTime={selectedLead.lastMessageTime}
              onOpenChat={handleOpenChat}
            />
          </div>
        </div>
        
        <div className="mt-6 bg-white/60 backdrop-blur-md rounded-xl border border-white/40 shadow-lg">
          <LeadDetailFooter onClose={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
};
