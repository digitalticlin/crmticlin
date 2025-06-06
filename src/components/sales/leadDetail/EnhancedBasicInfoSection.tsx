
import { useState } from "react";
import { KanbanLead } from "@/types/kanban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Mail, MapPin, Building, FileText, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EnhancedBasicInfoSectionProps {
  selectedLead: KanbanLead;
  onUpdateLead: (updates: Partial<KanbanLead>) => void;
}

export const EnhancedBasicInfoSection = ({
  selectedLead,
  onUpdateLead
}: EnhancedBasicInfoSectionProps) => {
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
    <div className="bg-white/30 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          Informações Básicas
        </h3>
        {!isEditing ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 border border-blue-300/30 backdrop-blur-sm rounded-lg transition-all duration-200 hover:scale-105"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSave}
              disabled={isLoading}
              className="bg-green-500/20 hover:bg-green-500/30 text-green-700 border border-green-300/30 backdrop-blur-sm rounded-lg transition-all duration-200 hover:scale-105"
            >
              <Save className="h-4 w-4 mr-1" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-700 border border-red-300/30 backdrop-blur-sm rounded-lg transition-all duration-200 hover:scale-105"
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Nome */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Nome
          </Label>
          {isEditing ? (
            <Input
              value={editedData.name}
              onChange={(e) => setEditedData({...editedData, name: e.target.value})}
              className="bg-white/50 border-white/30 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm"
            />
          ) : (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-gray-800 font-medium">{selectedLead.name}</p>
            </div>
          )}
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Telefone
          </Label>
          <div className="bg-gray-100/50 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="text-gray-700">{selectedLead.phone}</p>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </Label>
          {isEditing ? (
            <Input
              type="email"
              value={editedData.email}
              onChange={(e) => setEditedData({...editedData, email: e.target.value})}
              className="bg-white/50 border-white/30 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm"
              placeholder="email@exemplo.com"
            />
          ) : (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-gray-700">{selectedLead.email || 'Não informado'}</p>
            </div>
          )}
        </div>

        {/* Empresa */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center gap-2">
            <Building className="h-4 w-4" />
            Empresa
          </Label>
          {isEditing ? (
            <Input
              value={editedData.company}
              onChange={(e) => setEditedData({...editedData, company: e.target.value})}
              className="bg-white/50 border-white/30 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm"
              placeholder="Nome da empresa"
            />
          ) : (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-gray-700">{selectedLead.company || 'Não informado'}</p>
            </div>
          )}
        </div>

        {/* CPF/CNPJ */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            CPF/CNPJ
          </Label>
          {isEditing ? (
            <Input
              value={editedData.documentId}
              onChange={(e) => setEditedData({...editedData, documentId: e.target.value})}
              className="bg-white/50 border-white/30 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
          ) : (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-gray-700">{selectedLead.documentId || 'Não informado'}</p>
            </div>
          )}
        </div>

        {/* Endereço */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Endereço
          </Label>
          {isEditing ? (
            <Input
              value={editedData.address}
              onChange={(e) => setEditedData({...editedData, address: e.target.value})}
              className="bg-white/50 border-white/30 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm"
              placeholder="Endereço completo"
            />
          ) : (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-gray-700">{selectedLead.address || 'Não informado'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
