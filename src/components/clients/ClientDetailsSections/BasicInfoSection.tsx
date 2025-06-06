
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit, Phone, Mail, Building, Save, X } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";

interface BasicInfoSectionProps {
  client: ClientData;
  onUpdateBasicInfo?: (data: { name: string; email: string; company: string }) => void;
  isCreateMode?: boolean;
}

export function BasicInfoSection({ client, onUpdateBasicInfo, isCreateMode = false }: BasicInfoSectionProps) {
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(isCreateMode);
  const [editedClient, setEditedClient] = useState({
    name: client.name || "",
    email: client.email || "",
    company: client.company || ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveBasicInfo = async () => {
    if (!onUpdateBasicInfo) return;
    
    if (isCreateMode) {
      onUpdateBasicInfo(editedClient);
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateBasicInfo(editedClient);
      setIsEditingBasicInfo(false);
    } catch (error) {
      // Error is handled in the parent hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Informações Básicas</h3>
        {!isEditingBasicInfo && !isCreateMode && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditingBasicInfo(true)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid gap-4">
        <div className="flex items-start gap-3">
          <Building className="h-5 w-5 text-[#d3d800] mt-0.5" />
          <div className="flex-1">
            <Label className="text-sm font-medium text-white/90">Nome *</Label>
            {isEditingBasicInfo || isCreateMode ? (
              <Input
                value={editedClient.name}
                onChange={(e) => setEditedClient({...editedClient, name: e.target.value})}
                className="mt-1 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
                placeholder="Nome completo"
              />
            ) : (
              <p className="text-white/80">{client.name}</p>
            )}
          </div>
        </div>

        {!isCreateMode && (
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-[#d3d800] mt-0.5" />
            <div className="flex-1">
              <Label className="text-sm font-medium text-white/90">Telefone</Label>
              <p className="text-white/80 font-medium">{formatPhoneDisplay(client.phone)}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-[#d3d800] mt-0.5" />
          <div className="flex-1">
            <Label className="text-sm font-medium text-white/90">Email</Label>
            {isEditingBasicInfo || isCreateMode ? (
              <Input
                type="email"
                value={editedClient.email}
                onChange={(e) => setEditedClient({...editedClient, email: e.target.value})}
                className="mt-1 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
                placeholder="email@exemplo.com"
              />
            ) : (
              <p className="text-white/80">{client.email || 'Não informado'}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Building className="h-5 w-5 text-[#d3d800] mt-0.5" />
          <div className="flex-1">
            <Label className="text-sm font-medium text-white/90">Empresa</Label>
            {isEditingBasicInfo || isCreateMode ? (
              <Input
                value={editedClient.company}
                onChange={(e) => setEditedClient({...editedClient, company: e.target.value})}
                className="mt-1 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
                placeholder="Nome da empresa"
              />
            ) : (
              <p className="text-white/80">{client.company || 'Não informado'}</p>
            )}
          </div>
        </div>

        {isCreateMode && (
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-[#d3d800] mt-0.5" />
            <div className="flex-1">
              <Label className="text-sm font-medium text-white/90">Telefone *</Label>
              <Input
                value={client.phone || ""}
                onChange={(e) => onUpdateBasicInfo && onUpdateBasicInfo({...editedClient, phone: e.target.value} as any)}
                className="mt-1 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        )}

        {(isEditingBasicInfo || isCreateMode) && !isCreateMode && (
          <div className="flex gap-2 pt-4 border-t border-white/20">
            <Button 
              size="sm" 
              onClick={handleSaveBasicInfo}
              disabled={isLoading}
              className="bg-[#d3d800] hover:bg-[#b8c200] text-black"
            >
              <Save className="h-3 w-3 mr-1" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setIsEditingBasicInfo(false);
                setEditedClient({
                  name: client.name || "",
                  email: client.email || "",
                  company: client.company || ""
                });
              }}
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
