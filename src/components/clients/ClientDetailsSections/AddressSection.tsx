
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit, MapPin, Save, X } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";

interface AddressSectionProps {
  client: ClientData;
}

export function AddressSection({ client }: AddressSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    address: client.address || "",
    city: client.city || "",
    state: client.state || "",
    country: client.country || "Brasil",
    zip_code: client.zip_code || ""
  });

  const handleSave = () => {
    // Here you can implement the update logic for address info
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-[#d3d800]" />
          <h3 className="text-lg font-semibold text-gray-900">Endereço Completo</h3>
        </div>
        {!isEditing && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-700">Endereço</Label>
          {isEditing ? (
            <Input
              value={editedData.address}
              onChange={(e) => setEditedData({...editedData, address: e.target.value})}
              className="mt-1 border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800]"
              placeholder="Rua, número, complemento"
            />
          ) : (
            <p className="text-gray-900">{client.address || 'Não informado'}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Cidade</Label>
            {isEditing ? (
              <Input
                value={editedData.city}
                onChange={(e) => setEditedData({...editedData, city: e.target.value})}
                className="mt-1 border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800]"
                placeholder="Cidade"
              />
            ) : (
              <p className="text-gray-900">{client.city || 'Não informado'}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Estado</Label>
            {isEditing ? (
              <Input
                value={editedData.state}
                onChange={(e) => setEditedData({...editedData, state: e.target.value})}
                className="mt-1 border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800]"
                placeholder="Estado"
              />
            ) : (
              <p className="text-gray-900">{client.state || 'Não informado'}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">País</Label>
            {isEditing ? (
              <Input
                value={editedData.country}
                onChange={(e) => setEditedData({...editedData, country: e.target.value})}
                className="mt-1 border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800]"
                placeholder="País"
              />
            ) : (
              <p className="text-gray-900">{client.country || 'Brasil'}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">CEP</Label>
            {isEditing ? (
              <Input
                value={editedData.zip_code}
                onChange={(e) => setEditedData({...editedData, zip_code: e.target.value})}
                className="mt-1 border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800]"
                placeholder="00000-000"
              />
            ) : (
              <p className="text-gray-900">{client.zip_code || 'Não informado'}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Button 
              size="sm" 
              onClick={handleSave}
              className="bg-[#d3d800] hover:bg-[#b8c200] text-black"
            >
              <Save className="h-3 w-3 mr-1" />
              Salvar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setEditedData({
                  address: client.address || "",
                  city: client.city || "",
                  state: client.state || "",
                  country: client.country || "Brasil",
                  zip_code: client.zip_code || ""
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
