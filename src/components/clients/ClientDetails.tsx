
import { Contact } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { NotesField } from "@/components/sales/leadDetail/NotesField";
import { AssignedUserField } from "@/components/sales/leadDetail/AssignedUserField";
import { PurchaseValueField } from "@/components/sales/leadDetail/PurchaseValueField";
import { Pencil, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";

interface ClientDetailsProps {
  client: Contact;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (client: Contact) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateAssignedUser: (user: string) => void;
  onUpdatePurchaseValue: (value: number | undefined) => void;
}

export const ClientDetails = ({
  client,
  isOpen,
  onOpenChange,
  onEdit,
  onUpdateNotes,
  onUpdateAssignedUser,
  onUpdatePurchaseValue
}: ClientDetailsProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold">
              {client.name}
            </SheetTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onEdit(client)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          
          <SheetDescription className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
            
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
            )}
            
            {client.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{client.address}</span>
              </div>
            )}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Purchase Value Field */}
          <PurchaseValueField 
            purchaseValue={client.purchaseValue}
            onUpdatePurchaseValue={(value) => {
              onUpdatePurchaseValue(value);
              toast.success("Valor de compra atualizado");
            }}
          />
          
          {/* Assigned User Field */}
          <AssignedUserField 
            assignedUser={client.assignedUser}
            onUpdateAssignedUser={(user) => {
              onUpdateAssignedUser(user);
              toast.success("Responsável atualizado");
            }}
          />
          
          {/* Notes Field */}
          <NotesField 
            notes={client.notes}
            onUpdateNotes={(notes) => {
              onUpdateNotes(notes);
              toast.success("Observações atualizadas");
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
