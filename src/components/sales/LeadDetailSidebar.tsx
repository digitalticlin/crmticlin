
import { KanbanLead, KanbanTag } from "@/types/kanban";
import { MessageSquare, Save, DollarSign, User, Phone, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { TagSelector } from "./TagSelector";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

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
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [purchaseValueStr, setPurchaseValueStr] = useState("");
  const [assignedUser, setAssignedUser] = useState("");
  
  // Initialize values when lead changes
  const resetValues = () => {
    if (selectedLead) {
      setNameValue(selectedLead.name);
      setPurchaseValueStr(selectedLead.purchaseValue !== undefined ? selectedLead.purchaseValue.toString() : "");
      setAssignedUser(selectedLead.assignedUser || "");
      setIsEditingName(selectedLead.name.startsWith("ID:"));
    }
  };

  // Reset values when lead changes or modal opens
  if (isOpen && selectedLead && 
      (nameValue !== selectedLead.name || 
       (selectedLead.purchaseValue !== undefined ? selectedLead.purchaseValue.toString() : "") !== purchaseValueStr ||
       (selectedLead.assignedUser || "") !== assignedUser)) {
    resetValues();
  }

  const handleSave = () => {
    if (isEditingName && onUpdateName) {
      onUpdateName(nameValue);
      setIsEditingName(false);
      toast.success("Nome do lead atualizado");
    }
  };

  const handlePurchaseValueChange = () => {
    if (!onUpdatePurchaseValue) return;
    
    const numberValue = purchaseValueStr ? parseFloat(purchaseValueStr) : undefined;
    onUpdatePurchaseValue(numberValue);
    toast.success("Valor de compra atualizado");
  };

  const handleAssignedUserChange = () => {
    if (!onUpdateAssignedUser) return;
    
    onUpdateAssignedUser(assignedUser);
    toast.success("Responsável atualizado");
  };

  if (!selectedLead) return null;

  const isNewLead = selectedLead.name.startsWith("ID:");

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            {isEditingName ? (
              <div className="flex gap-2 items-center w-full">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  placeholder="Nome do lead"
                  className="text-xl font-semibold w-full"
                  autoFocus
                />
                <Button 
                  size="sm" 
                  variant="default" 
                  onClick={handleSave}
                  disabled={!nameValue.trim()}
                >
                  Salvar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <SheetTitle className="text-xl font-semibold">
                  {selectedLead.name}
                </SheetTitle>
                {isNewLead && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                    Editar nome
                  </Badge>
                )}
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setIsEditingName(true)}
                >
                  <PencilLine className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <SheetDescription className="flex items-center gap-1">
            <Phone className="h-4 w-4" />
            {selectedLead.phone}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Purchase Value */}
          {onUpdatePurchaseValue && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <DollarSign className="h-4 w-4 mr-1" /> Valor da Compra
              </h3>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  placeholder="0.00"
                  value={purchaseValueStr}
                  onChange={(e) => setPurchaseValueStr(e.target.value)}
                  className="w-full"
                />
                <Button size="sm" onClick={handlePurchaseValueChange}>
                  Salvar
                </Button>
              </div>
              {selectedLead.purchaseValue !== undefined && (
                <p className="text-sm text-muted-foreground mt-1">
                  Valor atual: {formatCurrency(selectedLead.purchaseValue)}
                </p>
              )}
            </div>
          )}
          
          {/* Assigned User */}
          {onUpdateAssignedUser && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <User className="h-4 w-4 mr-1" /> Responsável
              </h3>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Atribuir responsável"
                  value={assignedUser}
                  onChange={(e) => setAssignedUser(e.target.value)}
                  className="w-full"
                />
                <Button size="sm" onClick={handleAssignedUserChange}>
                  Salvar
                </Button>
              </div>
            </div>
          )}
          
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
