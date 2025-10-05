
import { ClientData } from "@/hooks/clients/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, X, Save } from "lucide-react";
import { BasicInfoSection } from "./ClientDetailsSections/BasicInfoSection";
import { DocumentSection } from "./ClientDetailsSections/DocumentSection";
import { AddressSection } from "./ClientDetailsSections/AddressSection";
import { ContactsSection } from "./ClientDetailsSections/ContactsSection";
import { NotesSection } from "./ClientDetailsSections/NotesSection";
import { DealsHistorySection } from "./ClientDetailsSections/DealsHistorySection";
import { useState } from "react";

interface RealClientDetailsProps {
  client: ClientData | null;
  isOpen: boolean;
  isCreateMode?: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateNotes?: (notes: string) => void;
  onUpdatePurchaseValue?: (value: number | undefined) => void;
  onUpdateBasicInfo?: (data: { name: string; email: string; company: string }) => void;
  onUpdateDocument?: (data: { document_type: 'cpf' | 'cnpj'; document_id: string }) => void;
  onUpdateAddress?: (data: { 
    address: string; 
    bairro: string;
    city: string; 
    state: string; 
    country: string; 
    zip_code: string 
  }) => void;
  onCreateClient?: (data: Partial<ClientData>) => void;
}

export function RealClientDetails({
  client,
  isOpen,
  isCreateMode = false,
  onOpenChange,
  onUpdateNotes,
  onUpdatePurchaseValue,
  onUpdateBasicInfo,
  onUpdateDocument,
  onUpdateAddress,
  onCreateClient
}: RealClientDetailsProps) {
  const [newClientData, setNewClientData] = useState<Partial<ClientData>>({
    name: "",
    email: "",
    company: "",
    phone: "",
    document_type: "cpf",
    document_id: "",
    address: "",
    city: "",
    state: "",
    country: "Brasil",
    zip_code: "",
    notes: ""
  });

  const currentClient = isCreateMode ? newClientData : client;

  const getStatusBadge = () => {
    if (!currentClient) return null;
    
    if (currentClient.purchase_value && currentClient.purchase_value > 0) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Cliente</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Lead</Badge>;
  };

  const handleSaveNewClient = () => {
    if (onCreateClient && newClientData.name && newClientData.phone) {
      onCreateClient(newClientData);
      setNewClientData({
        name: "",
        email: "",
        company: "",
        phone: "",
        document_type: "cpf",
        document_id: "",
        address: "",
        city: "",
        state: "",
        country: "Brasil",
        zip_code: "",
        notes: ""
      });
    }
  };

  const updateNewClientData = (field: keyof ClientData, value: any) => {
    setNewClientData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateModeBasicInfo = (data: { name: string; email: string; company: string }) => {
    setNewClientData(prev => ({ ...prev, ...data }));
  };

  const handleCreateModeDocument = (data: { document_type: 'cpf' | 'cnpj'; document_id: string }) => {
    setNewClientData(prev => ({ ...prev, ...data }));
  };

  const handleCreateModeAddress = (data: { 
    address: string; 
    city: string; 
    state: string; 
    country: string; 
    zip_code: string 
  }) => {
    setNewClientData(prev => ({ ...prev, ...data }));
  };

  const handleCreateModeNotes = (notes: string) => {
    setNewClientData(prev => ({ ...prev, notes }));
  };

  if (!currentClient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl md:h-[85vh] h-full flex flex-col bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl md:rounded-3xl rounded-none overflow-hidden">
        <DialogHeader className="border-b border-white/20 pb-3 md:pb-4 flex-shrink-0 px-4 md:px-6 pt-4 md:pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#d3d800] rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 md:h-6 md:w-6 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base md:text-xl font-semibold text-white truncate">
                  {isCreateMode ? "Novo Cliente/Lead" : currentClient.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  {!isCreateMode && getStatusBadge()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {isCreateMode && (
                <Button
                  onClick={handleSaveNewClient}
                  disabled={!newClientData.name || !newClientData.phone}
                  className="bg-[#d3d800] hover:bg-[#b8c200] text-black h-9 md:h-10 px-3 md:px-4"
                >
                  <Save className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Salvar</span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Coluna Esquerda */}
                <div className="space-y-4 md:space-y-6">
                  <BasicInfoSection
                    client={currentClient as ClientData}
                    onUpdateBasicInfo={isCreateMode ? handleCreateModeBasicInfo : onUpdateBasicInfo}
                    isCreateMode={isCreateMode}
                  />
                  <DocumentSection
                    client={currentClient as ClientData}
                    onUpdateDocument={isCreateMode ? handleCreateModeDocument : onUpdateDocument}
                    isCreateMode={isCreateMode}
                  />
                  <AddressSection
                    client={currentClient as ClientData}
                    onUpdateAddress={isCreateMode ? handleCreateModeAddress : onUpdateAddress}
                    isCreateMode={isCreateMode}
                  />
                  {!isCreateMode && <ContactsSection client={currentClient as ClientData} />}
                </div>

                {/* Coluna Direita */}
                <div className="space-y-4 md:space-y-6">
                  <NotesSection
                    client={currentClient as ClientData}
                    onUpdateNotes={isCreateMode ? handleCreateModeNotes : onUpdateNotes}
                    isCreateMode={isCreateMode}
                  />
                  {!isCreateMode && <DealsHistorySection clientId={(currentClient as ClientData).id} />}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
