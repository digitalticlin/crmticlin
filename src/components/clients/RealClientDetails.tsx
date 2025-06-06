
import { ClientData } from "@/hooks/clients/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, User, X } from "lucide-react";
import { BasicInfoSection } from "./ClientDetailsSections/BasicInfoSection";
import { DocumentSection } from "./ClientDetailsSections/DocumentSection";
import { AddressSection } from "./ClientDetailsSections/AddressSection";
import { ContactsSection } from "./ClientDetailsSections/ContactsSection";
import { PurchaseValueSection } from "./ClientDetailsSections/PurchaseValueSection";
import { NotesSection } from "./ClientDetailsSections/NotesSection";
import { LeadSystemInfoSection } from "./ClientDetailsSections/LeadSystemInfoSection";
import { DealsHistorySection } from "./ClientDetailsSections/DealsHistorySection";

interface RealClientDetailsProps {
  client: ClientData;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (client: ClientData) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdatePurchaseValue: (value: number | undefined) => void;
}

export function RealClientDetails({
  client,
  isOpen,
  onOpenChange,
  onEdit,
  onUpdateNotes,
  onUpdatePurchaseValue
}: RealClientDetailsProps) {
  const getStatusBadge = () => {
    if (client.purchase_value && client.purchase_value > 0) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Cliente</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Lead</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl">
        <DialogHeader className="border-b border-white/20 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#d3d800] rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-black" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-white">{client.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(client)}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
                <Edit className="h-4 w-4" />
                Editar Completo
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
            {/* Coluna Esquerda */}
            <div className="space-y-6">
              <BasicInfoSection client={client} />
              <DocumentSection client={client} />
              <AddressSection client={client} />
              <ContactsSection client={client} />
              <PurchaseValueSection 
                client={client} 
                onUpdatePurchaseValue={onUpdatePurchaseValue} 
              />
            </div>
            
            {/* Coluna Direita */}
            <div className="space-y-6">
              <LeadSystemInfoSection client={client} />
              <NotesSection 
                client={client} 
                onUpdateNotes={onUpdateNotes} 
              />
              <DealsHistorySection clientId={client.id} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
