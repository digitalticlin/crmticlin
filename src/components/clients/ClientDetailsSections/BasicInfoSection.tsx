
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit, Phone, Mail, Building, MapPin, Save, X } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";

interface BasicInfoSectionProps {
  client: ClientData;
}

export function BasicInfoSection({ client }: BasicInfoSectionProps) {
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [editedClient, setEditedClient] = useState({
    name: client.name,
    email: client.email || "",
    address: client.address || "",
    company: client.company || ""
  });

  const handleSaveBasicInfo = () => {
    // Here you can implement the update logic for basic info
    // For now just close the editing mode
    setIsEditingBasicInfo(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-[#d3d800]/30 shadow-xl shadow-[#d3d800]/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white border-b border-[#d3d800]/30 pb-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-[#d3d800] rounded-full shadow-lg shadow-[#d3d800]/50"></div>
          Informações Básicas
        </h3>
        {!isEditingBasicInfo && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditingBasicInfo(true)}
            className="text-[#d3d800] hover:text-black hover:bg-[#d3d800]/20 rounded-lg"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid gap-4">
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-[#d3d800]" />
          <div>
            <Label className="text-sm font-medium text-white/80">Telefone</Label>
            <p className="text-sm text-white">{formatPhoneDisplay(client.phone)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-[#d3d800]" />
          <div className="flex-1">
            <Label className="text-sm font-medium text-white/80">Email</Label>
            {isEditingBasicInfo ? (
              <Input
                type="email"
                value={editedClient.email}
                onChange={(e) => setEditedClient({...editedClient, email: e.target.value})}
                className="bg-white/20 backdrop-blur-sm border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800]/20 text-white placeholder:text-white/60"
                placeholder="email@exemplo.com"
              />
            ) : (
              <p className="text-sm text-white">{client.email || 'Não informado'}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Building className="h-4 w-4 text-[#d3d800]" />
          <div className="flex-1">
            <Label className="text-sm font-medium text-white/80">Empresa</Label>
            {isEditingBasicInfo ? (
              <Input
                value={editedClient.company}
                onChange={(e) => setEditedClient({...editedClient, company: e.target.value})}
                className="bg-white/20 backdrop-blur-sm border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800]/20 text-white placeholder:text-white/60"
                placeholder="Nome da empresa"
              />
            ) : (
              <p className="text-sm text-white">{client.company || 'Não informado'}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-[#d3d800]" />
          <div className="flex-1">
            <Label className="text-sm font-medium text-white/80">Endereço</Label>
            {isEditingBasicInfo ? (
              <Input
                value={editedClient.address}
                onChange={(e) => setEditedClient({...editedClient, address: e.target.value})}
                className="bg-white/20 backdrop-blur-sm border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800]/20 text-white placeholder:text-white/60"
                placeholder="Endereço completo"
              />
            ) : (
              <p className="text-sm text-white">{client.address || 'Não informado'}</p>
            )}
          </div>
        </div>

        {isEditingBasicInfo && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSaveBasicInfo}
              className="bg-[#d3d800]/80 hover:bg-[#d3d800] text-black border-2 border-[#d3d800] shadow-lg font-semibold"
            >
              <Save className="h-3 w-3 mr-1" />
              Salvar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setIsEditingBasicInfo(false);
                setEditedClient({
                  name: client.name,
                  email: client.email || "",
                  address: client.address || "",
                  company: client.company || ""
                });
              }}
              className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
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
