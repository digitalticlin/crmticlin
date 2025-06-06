
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
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
        {!isEditingBasicInfo && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditingBasicInfo(true)}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid gap-4">
        <div className="flex items-start gap-3">
          <Phone className="h-5 w-5 text-[#d3d800] mt-0.5" />
          <div className="flex-1">
            <Label className="text-sm font-medium text-gray-700">Telefone</Label>
            <p className="text-gray-900 font-medium">{formatPhoneDisplay(client.phone)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-[#d3d800] mt-0.5" />
          <div className="flex-1">
            <Label className="text-sm font-medium text-gray-700">Email</Label>
            {isEditingBasicInfo ? (
              <Input
                type="email"
                value={editedClient.email}
                onChange={(e) => setEditedClient({...editedClient, email: e.target.value})}
                className="mt-1 border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800]"
                placeholder="email@exemplo.com"
              />
            ) : (
              <p className="text-gray-900">{client.email || 'Não informado'}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Building className="h-5 w-5 text-[#d3d800] mt-0.5" />
          <div className="flex-1">
            <Label className="text-sm font-medium text-gray-700">Empresa</Label>
            {isEditingBasicInfo ? (
              <Input
                value={editedClient.company}
                onChange={(e) => setEditedClient({...editedClient, company: e.target.value})}
                className="mt-1 border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800]"
                placeholder="Nome da empresa"
              />
            ) : (
              <p className="text-gray-900">{client.company || 'Não informado'}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-[#d3d800] mt-0.5" />
          <div className="flex-1">
            <Label className="text-sm font-medium text-gray-700">Endereço</Label>
            {isEditingBasicInfo ? (
              <Input
                value={editedClient.address}
                onChange={(e) => setEditedClient({...editedClient, address: e.target.value})}
                className="mt-1 border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800]"
                placeholder="Endereço completo"
              />
            ) : (
              <p className="text-gray-900">{client.address || 'Não informado'}</p>
            )}
          </div>
        </div>

        {isEditingBasicInfo && (
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Button 
              size="sm" 
              onClick={handleSaveBasicInfo}
              className="bg-[#d3d800] hover:bg-[#b8c200] text-black"
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
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
