
import { useState } from "react";
import { KanbanLead } from "@/types/kanban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GlassmorphismAddressSectionProps {
  selectedLead: KanbanLead;
  onUpdateLead: (updates: Partial<KanbanLead>) => void;
}

export const GlassmorphismAddressSection = ({
  selectedLead,
  onUpdateLead
}: GlassmorphismAddressSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedData, setEditedData] = useState({
    address: selectedLead.address || "",
    bairro: selectedLead.bairro || "",
    city: selectedLead.city || "",
    state: selectedLead.state || "",
    country: selectedLead.country || "Brasil",
    zip_code: selectedLead.zip_code || ""
  });

  const handleSave = async () => {
    if (!selectedLead.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          address: editedData.address,
          bairro: editedData.bairro,
          cidade: editedData.city,
          estado: editedData.state,
          pais: editedData.country,
          cep: editedData.zip_code
        })
        .eq('id', selectedLead.id);

      if (error) throw error;

      onUpdateLead(editedData);
      setIsEditing(false);
      toast.success('Endereço atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error('Erro ao atualizar endereço');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedData({
      address: selectedLead.address || "",
      bairro: selectedLead.bairro || "",
      city: selectedLead.city || "",
      state: selectedLead.state || "",
      country: selectedLead.country || "Brasil",
      zip_code: selectedLead.zip_code || ""
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-400/80 to-pink-300/80 rounded-xl shadow-lg shadow-purple-400/30">
            <MapPin className="h-5 w-5 text-black" />
          </div>
          Endereço Completo
        </h3>
        
        {!isEditing ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-lime-400/20 to-yellow-300/20 hover:from-lime-400/30 hover:to-yellow-300/30 text-lime-300 border border-lime-400/40 backdrop-blur-sm rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-lime-400/20"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSave}
              disabled={isLoading}
              className="bg-gradient-to-r from-lime-400/90 to-yellow-300/90 backdrop-blur-sm text-black font-semibold hover:from-lime-500/90 hover:to-yellow-400/90 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 transition-all duration-200 hover:scale-105"
            >
              <Save className="h-4 w-4 mr-1" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
              className="bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 hover:text-white shadow-lg transition-all duration-200 hover:scale-105"
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {/* Endereço */}
        <div className="space-y-3">
          <Label className="text-white/90 font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-lime-400" />
            Endereço
          </Label>
          {isEditing ? (
            <Input
              value={editedData.address}
              onChange={(e) => setEditedData({...editedData, address: e.target.value})}
              className="bg-white/15 backdrop-blur-sm border-lime-400/40 text-white placeholder:text-white/60 focus:border-lime-400 focus:ring-lime-400/30 rounded-xl"
              placeholder="Rua, número, complemento"
            />
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/80">{selectedLead.address || 'Não informado'}</p>
            </div>
          )}
        </div>

        {/* Bairro */}
        <div className="space-y-3">
          <Label className="text-white/90 font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-lime-400" />
            Bairro
          </Label>
          {isEditing ? (
            <Input
              value={editedData.bairro}
              onChange={(e) => setEditedData({...editedData, bairro: e.target.value})}
              className="bg-white/15 backdrop-blur-sm border-lime-400/40 text-white placeholder:text-white/60 focus:border-lime-400 focus:ring-lime-400/30 rounded-xl"
              placeholder="Nome do bairro"
            />
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/80">{selectedLead.bairro || 'Não informado'}</p>
            </div>
          )}
        </div>

        {/* Cidade e Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-white/90 font-medium">Cidade</Label>
            {isEditing ? (
              <Input
                value={editedData.city}
                onChange={(e) => setEditedData({...editedData, city: e.target.value})}
                className="bg-white/15 backdrop-blur-sm border-lime-400/40 text-white placeholder:text-white/60 focus:border-lime-400 focus:ring-lime-400/30 rounded-xl"
                placeholder="Cidade"
              />
            ) : (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-white/80">{selectedLead.city || 'Não informado'}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-white/90 font-medium">Estado</Label>
            {isEditing ? (
              <Input
                value={editedData.state}
                onChange={(e) => setEditedData({...editedData, state: e.target.value})}
                className="bg-white/15 backdrop-blur-sm border-lime-400/40 text-white placeholder:text-white/60 focus:border-lime-400 focus:ring-lime-400/30 rounded-xl"
                placeholder="Estado"
              />
            ) : (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-white/80">{selectedLead.state || 'Não informado'}</p>
              </div>
            )}
          </div>
        </div>

        {/* País e CEP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-white/90 font-medium">País</Label>
            {isEditing ? (
              <Input
                value={editedData.country}
                onChange={(e) => setEditedData({...editedData, country: e.target.value})}
                className="bg-white/15 backdrop-blur-sm border-lime-400/40 text-white placeholder:text-white/60 focus:border-lime-400 focus:ring-lime-400/30 rounded-xl"
                placeholder="País"
              />
            ) : (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-white/80">{selectedLead.country || 'Brasil'}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-white/90 font-medium">CEP</Label>
            {isEditing ? (
              <Input
                value={editedData.zip_code}
                onChange={(e) => setEditedData({...editedData, zip_code: e.target.value})}
                className="bg-white/15 backdrop-blur-sm border-lime-400/40 text-white placeholder:text-white/60 focus:border-lime-400 focus:ring-lime-400/30 rounded-xl"
                placeholder="00000-000"
              />
            ) : (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-white/80">{selectedLead.zip_code || 'Não informado'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
