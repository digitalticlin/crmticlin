
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit, Phone, Mail, Building, MapPin, Save, X } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { useUpdateClientMutation } from "@/hooks/clients/mutations";
import { useCompanyData } from "@/hooks/useCompanyData";
import { toast } from "sonner";

interface BasicInfoSectionProps {
  client: ClientData;
}

export function BasicInfoSection({ client }: BasicInfoSectionProps) {
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [editedClient, setEditedClient] = useState({
    name: client.name,
    email: client.email || "",
    company: client.company || ""
  });
  
  const { companyId } = useCompanyData();
  const updateClientMutation = useUpdateClientMutation(companyId);

  const handleSaveBasicInfo = async () => {
    try {
      await updateClientMutation.mutateAsync({
        id: client.id,
        data: editedClient
      });
      setIsEditingBasicInfo(false);
      toast.success("Informações básicas atualizadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar informações básicas");
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Informações Básicas</h3>
        {!isEditingBasicInfo && (
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
            <Label className="text-sm font-medium text-white/90">Nome</Label>
            {isEditingBasicInfo ? (
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

        <div className="flex items-start gap-3">
          <Phone className="h-5 w-5 text-[#d3d800] mt-0.5" />
          <div className="flex-1">
            <Label className="text-sm font-medium text-white/90">Telefone</Label>
            <p className="text-white/80 font-medium">{formatPhoneDisplay(client.phone)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-[#d3d800] mt-0.5" />
          <div className="flex-1">
            <Label className="text-sm font-medium text-white/90">Email</Label>
            {isEditingBasicInfo ? (
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
            {isEditingBasicInfo ? (
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

        {isEditingBasicInfo && (
          <div className="flex gap-2 pt-4 border-t border-white/20">
            <Button 
              size="sm" 
              onClick={handleSaveBasicInfo}
              disabled={updateClientMutation.isPending}
              className="bg-[#d3d800] hover:bg-[#b8c200] text-black"
            >
              <Save className="h-3 w-3 mr-1" />
              {updateClientMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setIsEditingBasicInfo(false);
                setEditedClient({
                  name: client.name,
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
