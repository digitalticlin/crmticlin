
import { useState } from "react";
import { KanbanLead } from "@/types/kanban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCheck, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GlassmorphismOwnerSectionProps {
  selectedLead: KanbanLead;
  onUpdateLead: (updates: Partial<KanbanLead>) => void;
}

export const GlassmorphismOwnerSection = ({
  selectedLead,
  onUpdateLead
}: GlassmorphismOwnerSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ownerId, setOwnerId] = useState(selectedLead.owner_id || "");

  const handleSave = async () => {
    if (!selectedLead.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          owner_id: ownerId || null
        })
        .eq('id', selectedLead.id);

      if (error) throw error;

      onUpdateLead({ owner_id: ownerId });
      setIsEditing(false);
      toast.success('Responsável atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating owner:', error);
      toast.error('Erro ao atualizar responsável');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setOwnerId(selectedLead.owner_id || "");
    setIsEditing(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-400/80 to-red-300/80 rounded-xl shadow-lg shadow-orange-400/30">
            <UserCheck className="h-5 w-5 text-black" />
          </div>
          Responsável pelo Lead
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

      <div className="space-y-3">
        <Label className="text-white/90 font-medium flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-lime-400" />
          ID do Responsável
        </Label>
        {isEditing ? (
          <Input
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="bg-white/15 backdrop-blur-sm border-lime-400/40 text-white placeholder:text-white/60 focus:border-lime-400 focus:ring-lime-400/30 rounded-xl"
            placeholder="ID do usuário responsável"
          />
        ) : (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-white/80">{selectedLead.owner_id || 'Nenhum responsável definido'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
