
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { KanbanLead, KanbanTag } from "@/types/kanban";

interface LeadDetailProps {
  lead: KanbanLead;
  isOpen: boolean;
  onClose: () => void;
  onToggleTag: (leadId: string, tagId: string) => void;
  onCreateTag: (name: string, color: string) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdatePurchaseValue: (value: number | undefined) => void;
  onUpdateAssignedUser: (user: string) => void;
  onUpdateName: (name: string) => void;
  availableTags: KanbanTag[];
}

export const LeadDetail: React.FC<LeadDetailProps> = ({
  lead,
  isOpen,
  onClose,
  onToggleTag,
  onCreateTag,
  onUpdateNotes,
  onUpdatePurchaseValue,
  onUpdateAssignedUser,
  onUpdateName,
  availableTags
}) => {
  const [name, setName] = React.useState(lead.name);
  const [notes, setNotes] = React.useState(lead.notes || '');
  const [purchaseValue, setPurchaseValue] = React.useState(lead.purchaseValue || 0);
  const [assignedUser, setAssignedUser] = React.useState(lead.assignedUser || '');

  const handleSave = () => {
    onUpdateName(name);
    onUpdateNotes(notes);
    onUpdatePurchaseValue(purchaseValue);
    onUpdateAssignedUser(assignedUser);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Lead</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do lead"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <Input value={lead.phone} disabled />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input value={lead.email || ''} disabled />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Valor da Compra</label>
            <Input
              type="number"
              value={purchaseValue}
              onChange={(e) => setPurchaseValue(Number(e.target.value))}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione suas notas aqui..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              Salvar
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
