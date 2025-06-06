
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

  const handleUpdateLead = (updates: Partial<KanbanLead>) => {
    console.log("Updating lead:", updates);
    toast.success("Lead atualizado com sucesso!");
  };

  if (!selectedLead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-2xl border-none shadow-2xl">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-lime-400/5 via-yellow-300/5 to-lime-500/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-300/10 rounded-full blur-2xl pointer-events-none" />
        
        <SheetHeader className="p-0 mb-6 relative z-10">
          <GlassmorphismLeadHeader 
            selectedLead={selectedLead}
            onUpdateName={handleNameUpdate}
            onClose={() => onOpenChange(false)}
          />
        </SheetHeader>
        
        <div className="space-y-6 relative z-10">
          {/* Enhanced Basic Info Section */}
          <GlassmorphismBasicInfo 
            selectedLead={selectedLead}
            onUpdateLead={handleUpdateLead}
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
            <h3 className="text-white/90 font-medium flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-lime-400/80 to-yellow-300/80 rounded-xl shadow-lg shadow-lime-400/30">
                <div className="h-5 w-5 bg-black rounded-sm" />
              </div>
              Tags
            </h3>
            <TagSelector
              availableTags={availableTags}
              selectedTags={selectedLead.tags}
              onToggleTag={onToggleTag}
              onCreateTag={onCreateTag}
            />
          </div>

          {/* Deal History */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
            <h3 className="text-white/90 font-medium flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-lime-400/80 to-yellow-300/80 rounded-xl shadow-lg shadow-lime-400/30">
                <div className="h-5 w-5 bg-black rounded-sm" />
              </div>
              Histórico de Negociações
            </h3>
            <GlassmorphismDealHistory deals={deals} />
          </div>
          
          {/* Notes Field */}
          <GlassmorphismNotes 
            notes={selectedLead.notes}
            onUpdateNotes={(notes) => {
              onUpdateNotes(notes);
              toast.success("Observações atualizadas");
            }}
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
