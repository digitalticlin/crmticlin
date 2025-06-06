
import { KanbanLead, KanbanTag } from "@/types/kanban";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import { TagSelector } from "./TagSelector";
import { GlassmorphismLeadHeader } from "./leadDetail/GlassmorphismLeadHeader";
import { GlassmorphismPurchaseValue } from "./leadDetail/GlassmorphismPurchaseValue";
import { GlassmorphismAssignedUser } from "./leadDetail/GlassmorphismAssignedUser";
import { GlassmorphismNotes } from "./leadDetail/GlassmorphismNotes";
import { GlassmorphismChatPreview } from "./leadDetail/GlassmorphismChatPreview";
import { GlassmorphismDealHistory } from "./leadDetail/GlassmorphismDealHistory";
import { GlassmorphismBasicInfo } from "./leadDetail/GlassmorphismBasicInfo";
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

  useEffect(() => {
    if (selectedLead?.id) {
      refetchDeals();
    }
  }, [selectedLead?.id, refetchDeals]);

  const handleOpenChat = () => {
    onOpenChange(false);
  };

  const handleNameUpdate = (name: string) => {
    if (onUpdateName) {
      onUpdateName(name);
      toast.success("Nome do lead atualizado");
    }
  };

  if (!selectedLead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-black/20 backdrop-blur-xl border-lime-400/30 shadow-2xl shadow-lime-400/10">
        <SheetHeader className="p-0 mb-6">
          <GlassmorphismLeadHeader 
            selectedLead={selectedLead}
            onUpdateName={handleNameUpdate}
            onClose={() => onOpenChange(false)}
          />
        </SheetHeader>
        
        <div className="space-y-6">
          {/* Enhanced Basic Info Section */}
          <GlassmorphismBasicInfo 
            selectedLead={selectedLead}
            onUpdateLead={(updates) => {
              console.log("Updating lead basic info:", updates);
            }}
          />
          
          {/* Purchase Value Field */}
          <GlassmorphismPurchaseValue 
            purchaseValue={selectedLead.purchaseValue}
            onUpdatePurchaseValue={onUpdatePurchaseValue ? 
              (value) => {
                onUpdatePurchaseValue(value);
                toast.success("Valor de compra atualizado");
              } : undefined}
          />
          
          {/* Assigned User Field */}
          <GlassmorphismAssignedUser 
            assignedUser={selectedLead.assignedUser}
            onUpdateAssignedUser={onUpdateAssignedUser ? 
              (user) => {
                onUpdateAssignedUser(user);
                toast.success("Responsável atualizado");
              } : undefined}
          />
          
          {/* Tags Selector */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
            <TagSelector
              availableTags={availableTags}
              selectedTags={selectedLead.tags}
              onToggleTag={onToggleTag}
              onCreateTag={onCreateTag}
            />
          </div>

          {/* Deal History - Removido botão adicionar, mantidos totais */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-lime-400 rounded-full shadow-lg shadow-lime-400/50"></div>
              Histórico de Negociações
            </h3>
            <GlassmorphismDealHistory deals={deals} />
          </div>
          
          {/* Notes Field */}
          <GlassmorphismNotes 
            notes={selectedLead.notes}
            onUpdateNotes={onUpdateNotes}
          />
          
          {/* Chat Preview */}
          <GlassmorphismChatPreview 
            lastMessage={selectedLead.lastMessage}
            lastMessageTime={selectedLead.lastMessageTime}
            onOpenChat={handleOpenChat}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
