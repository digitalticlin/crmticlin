import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit, MapPin, Save, X } from "lucide-react";
import { Contact } from "@/types/chat";

interface AddressSectionProps {
  contact: Contact;
  onUpdateAddress?: (data: {
    address: string;
    bairro: string;
    cidade: string;
    estado: string;
    pais: string;
    cep: string;
  }) => void;
}

export const AddressSection = ({ contact, onUpdateAddress }: AddressSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedData, setEditedData] = useState({
    address: contact.address || "",
    bairro: contact.bairro || "",
    cidade: contact.cidade || "",
    estado: contact.estado || "",
    pais: contact.pais || "Brasil",
    cep: contact.cep || ""
  });

  const handleSave = async () => {
    if (!onUpdateAddress) return;

    setIsLoading(true);
    try {
      await onUpdateAddress(editedData);
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao atualizar endereço:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedData({
      address: contact.address || "",
      bairro: contact.bairro || "",
      cidade: contact.cidade || "",
      estado: contact.estado || "",
      pais: contact.pais || "Brasil",
      cep: contact.cep || ""
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-800">📍 Endereço Completo</h3>
        </div>
        {!isEditing && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-gray-600 hover:text-gray-800 hover:bg-white/20"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid gap-4">
        {/* Endereço Principal */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Endereço</Label>
          {isEditing ? (
            <Input
              value={editedData.address}
              onChange={(e) => setEditedData({...editedData, address: e.target.value})}
              className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
              placeholder="Rua, número, complemento"
            />
          ) : (
            <p className="text-gray-800 mt-1">{contact.address || 'Não informado'}</p>
          )}
        </div>

        {/* Bairro */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Bairro</Label>
          {isEditing ? (
            <Input
              value={editedData.bairro}
              onChange={(e) => setEditedData({...editedData, bairro: e.target.value})}
              className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
              placeholder="Nome do bairro"
            />
          ) : (
            <p className="text-gray-800 mt-1">{contact.bairro || 'Não informado'}</p>
          )}
        </div>

        {/* Cidade e Estado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Cidade</Label>
            {isEditing ? (
              <Input
                value={editedData.cidade}
                onChange={(e) => setEditedData({...editedData, cidade: e.target.value})}
                className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
                placeholder="Cidade"
              />
            ) : (
              <p className="text-gray-800 mt-1">{contact.cidade || 'Não informado'}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Estado</Label>
            {isEditing ? (
              <Input
                value={editedData.estado}
                onChange={(e) => setEditedData({...editedData, estado: e.target.value})}
                className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
                placeholder="Estado/UF"
              />
            ) : (
              <p className="text-gray-800 mt-1">{contact.estado || 'Não informado'}</p>
            )}
          </div>
        </div>

        {/* País e CEP */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">País</Label>
            {isEditing ? (
              <Input
                value={editedData.pais}
                onChange={(e) => setEditedData({...editedData, pais: e.target.value})}
                className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
                placeholder="País"
              />
            ) : (
              <p className="text-gray-800 mt-1">{contact.pais || 'Brasil'}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">CEP</Label>
            {isEditing ? (
              <Input
                value={editedData.cep}
                onChange={(e) => setEditedData({...editedData, cep: e.target.value})}
                className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
                placeholder="00000-000"
              />
            ) : (
              <p className="text-gray-800 mt-1">{contact.cep || 'Não informado'}</p>
            )}
          </div>
        </div>

        {/* Botões de ação */}
        {isEditing && (
          <div className="flex gap-2 pt-4 border-t border-white/30">
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Save className="h-3 w-3 mr-1" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancel}
              className="bg-white/20 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white/30"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};