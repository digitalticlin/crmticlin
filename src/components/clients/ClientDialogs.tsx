
import { Contact } from "@/types/chat";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientForm } from "@/components/clients/ClientForm";

interface ClientDialogsProps {
  selectedClient: Contact | null;
  isFormOpen: boolean;
  isEditing: boolean;
  onOpenChange: (open: boolean) => void;
  onFormSubmit: (data: any) => void;
}

export function ClientDialogs({
  selectedClient,
  isFormOpen,
  isEditing,
  onOpenChange,
  onFormSubmit
}: ClientDialogsProps) {
  return (
    <Dialog open={isFormOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Cliente" : "Adicionar Novo Cliente"}
          </DialogTitle>
        </DialogHeader>
        <ClientForm
          client={isEditing ? selectedClient || undefined : undefined}
          onSubmit={onFormSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
