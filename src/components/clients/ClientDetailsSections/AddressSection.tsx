
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit, MapPin, Save, X } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";

interface AddressSectionProps {
  client: ClientData;
  onUpdateAddress?: (data: { 
    address: string; 
    city: string; 
    state: string; 
    country: string; 
    zip_code: string 
  }) => void;
  isCreateMode?: boolean;
}

export function AddressSection({ client, onUpdateAddress, isCreateMode = false }: AddressSectionProps) {
  const [isEditing, setIsEditing] = useState(isCreateMode);
  const [editedData, setEditedData] = useState({
    address: client.address || "",
    city: client.city || "",
    state: client.state || "",
    country: client.country || "Brasil",
    zip_code: client.zip_code || ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!onUpdateAddress) return;

    if (isCreateMode) {
      onUpdateAddress(editedData);
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateAddress(editedData);
      setIsEditing(false);
    } catch (error) {
      // Error is handled in the parent hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-[#d3d800]" />
          <h3 className="text-lg font-semibold text-white">Endereço Completo</h3>
        </div>
        {!isEditing && !isCreateMode && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid gap-4">
        <div>
          <Label className="text-sm font-medium text-white/90">Endereço</Label>
          {isEditing || isCreateMode ? (
            <Input
              value={editedData.address}
              onChange={(e) => setEditedData({...editedData, address: e.target.value})}
              className="mt-1 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
              placeholder="Rua, número, complemento"
            />
          ) : (
            <p className="text-white/80">{client.address || 'Não informado'}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-white/90">Cidade</Label>
            {isEditing || isCreateMode ? (
              <Input
                value={editedData.city}
                onChange={(e) => setEditedData({...editedData, city: e.target.value})}
                className="mt-1 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
                placeholder="Cidade"
              />
            ) : (
              <p className="text-white/80">{client.city || 'Não informado'}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-white/90">Estado</Label>
            {isEditing || isCreateMode ? (
              <Input
                value={editedData.state}
                onChange={(e) => setEditedData({...editedData, state: e.target.value})}
                className="mt-1 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
                placeholder="Estado"
              />
            ) : (
              <p className="text-white/80">{client.state || 'Não informado'}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-white/90">País</Label>
            {isEditing || isCreateMode ? (
              <Input
                value={editedData.country}
                onChange={(e) => setEditedData({...editedData, country: e.target.value})}
                className="mt-1 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
                placeholder="País"
              />
            ) : (
              <p className="text-white/80">{client.country || 'Brasil'}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-white/90">CEP</Label>
            {isEditing || isCreateMode ? (
              <Input
                value={editedData.zip_code}
                onChange={(e) => setEditedData({...editedData, zip_code: e.target.value})}
                className="mt-1 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
                placeholder="00000-000"
              />
            ) : (
              <p className="text-white/80">{client.zip_code || 'Não informado'}</p>
            )}
          </div>
        </div>

        {(isEditing || isCreateMode) && !isCreateMode && (
          <div className="flex gap-2 pt-4 border-t border-white/20">
            <Button 
              size="sm" 
              onClick={handleSave}
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
                setIsEditing(false);
                setEditedData({
                  address: client.address || "",
                  city: client.city || "",
                  state: client.state || "",
                  country: client.country || "Brasil",
                  zip_code: client.zip_code || ""
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
