
import { ClientData } from "@/hooks/clients/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, User, X } from "lucide-react";
import { BasicInfoSection } from "./ClientDetailsSections/BasicInfoSection";
import { PurchaseValueSection } from "./ClientDetailsSections/PurchaseValueSection";
import { NotesSection } from "./ClientDetailsSections/NotesSection";
import { SystemInfoSection } from "./ClientDetailsSections/SystemInfoSection";
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
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden bg-white border border-gray-200 shadow-xl">
        <DialogHeader className="border-b border-gray-100 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#d3d800] rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-black" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">{client.name}</DialogTitle>
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
                className="flex items-center gap-2 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4" />
                Editar Completo
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="space-y-6">
              <BasicInfoSection client={client} />
              <PurchaseValueSection 
                client={client} 
                onUpdatePurchaseValue={onUpdatePurchaseValue} 
              />
              <SystemInfoSection client={client} />
            </div>
            
            {/* Coluna Direita */}
            <div className="space-y-6">
              <NotesSection 
                client={client} 
                onUpdateNotes={onUpdateNotes} 
              />
              <DealsHistorySection clientId={client.id} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
