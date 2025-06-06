
import { useState } from "react";
import { KanbanLead } from "@/types/kanban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Mail, MapPin, Building, FileText, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GlassmorphismBasicInfoProps {
  selectedLead: KanbanLead;
  onUpdateLead: (updates: Partial<KanbanLead>) => void;
}

export const GlassmorphismBasicInfo = ({
  selectedLead,
  onUpdateLead
}: GlassmorphismBasicInfoProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedData, setEditedData] = useState({
    name: selectedLead.name || "",
    email: selectedLead.email || "",
    company: selectedLead.company || "",
    documentId: selectedLead.documentId || "",
    address: selectedLead.address || ""
  });

  const handleSave = async () => {
    if (!selectedLead.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          name: editedData.name,
          email: editedData.email,
          company: editedData.company,
          document_id: editedData.documentId,
          address: editedData.address
        })
        .eq('id', selectedLead.id);

      if (error) throw error;

      onUpdateLead(editedData);
      setIsEditing(false);
      toast.success('Informações atualizadas com sucesso!');
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Erro ao atualizar informações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedData({
      name: selectedLead.name || "",
      email: selectedLead.email || "",
      company: selectedLead.company || "",
      documentId: selectedLead.documentId || "",
      address: selectedLead.address || ""
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-lime-400/80 to-yellow-300/80 rounded-xl shadow-lg shadow-lime-400/30">
            <User className="h-5 w-5 text-black" />
          </div>
          Informações Básicas
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
        {/* Nome */}
        <div className="space-y-3">
          <Label className="text-white/90 font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-lime-400" />
            Nome
          </Label>
          {isEditing ? (
            <Input
              value={editedData.name}
              onChange={(e) => setEditedData({...editedData, name: e.target.value})}
              className="bg-white/15 backdrop-blur-sm border-lime-400/40 text-white placeholder:text-white/60 focus:border-lime-400 focus:ring-lime-400/30 rounded-xl"
            />
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white font-medium">{selectedLead.name}</p>
            </div>
          )}
        </div>

        {/* Telefone */}
        <div className="space-y-3">
          <Label className="text-white/90 font-medium flex items-center gap-2">
            <Phone className="h-4 w-4 text-lime-400" />
            Telefone
          </Label>
          <div className="bg-gradient-to-r from-gray-500/20 to-gray-600/20 backdrop-blur-sm rounded-xl p-4 border border-gray-400/30">
            <p className="text-white/80">{selectedLead.phone}</p>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-3">
          <Label className="text-white/90 font-medium flex items-center gap-2">
            <Mail className="h-4 w-4 text-lime-400" />
            Email
          </Label>
          {isEditing ? (
            <Input
              type="email"
              value={editedData.email}
              onChange={(e) => setEditedData({...editedData, email: e.target.value})}
              className="bg-white/15 backdrop-blur-sm border-lime-400/40 text-white placeholder:text-white/60 focus:border-lime-400 focus:ring-lime-400/30 rounded-xl"
              placeholder="email@exemplo.com"
            />
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/80">{selectedLead.email || 'Não informado'}</p>
            </div>
          )}
        </div>

        {/* Empresa */}
        <div className="space-y-3">
          <Label className="text-white/90 font-medium flex items-center gap-2">
            <Building className="h-4 w-4 text-lime-400" />
            Empresa
          </Label>
          {isEditing ? (
            <Input
              value={editedData.company}
              onChange={(e) => setEditedData({...editedData, company: e.target.value})}
              className="bg-white/15 backdrop-blur-sm border-lime-400/40 text-white placeholder:text-white/60 focus:border-lime-400 focus:ring-lime-400/30 rounded-xl"
              placeholder="Nome da empresa"
            />
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/80">{selectedLead.company || 'Não informado'}</p>
            </div>
          )}
        </div>

        {/* CPF/CNPJ */}
        <div className="space-y-3">
          <Label className="text-white/90 font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-lime-400" />
            CPF/CNPJ
          </Label>
          {isEditing ? (
            <Input
              value={editedData.documentId}
              onChange={(e) => setEditedData({...editedData, documentId: e.target.value})}
              className="bg-white/15 backdrop-blur-sm border-lime-400/40 text-white placeholder:text-white/60 focus:border-lime-400 focus:ring-lime-400/30 rounded-xl"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/80">{selectedLead.documentId || 'Não informado'}</p>
            </div>
          )}
        </div>

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
              placeholder="Endereço completo"
            />
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/80">{selectedLead.address || 'Não informado'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
