
import { ClientData } from "@/hooks/clients/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { BasicInfoSection } from "./ClientDetailsSections/BasicInfoSection";
import { PurchaseValueSection } from "./ClientDetailsSections/PurchaseValueSection";
import { NotesSection } from "./ClientDetailsSections/NotesSection";
import { SystemInfoSection } from "./ClientDetailsSections/SystemInfoSection";

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
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto bg-black/20 backdrop-blur-xl border-[#d3d800]/30 shadow-2xl shadow-[#d3d800]/10">
        <SheetHeader className="space-y-4 pb-6 border-b border-white/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold text-white">{client.name}</SheetTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(client)}
              className="flex items-center gap-2 bg-[#d3d800]/20 border-[#d3d800]/40 text-[#d3d800] hover:bg-[#d3d800]/30 hover:text-black"
            >
              <Edit className="h-4 w-4" />
              Editar Completo
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <BasicInfoSection client={client} />
          
          <PurchaseValueSection 
            client={client} 
            onUpdatePurchaseValue={onUpdatePurchaseValue} 
          />
          
          <NotesSection 
            client={client} 
            onUpdateNotes={onUpdateNotes} 
          />
          
          <SystemInfoSection client={client} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
