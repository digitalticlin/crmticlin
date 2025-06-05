
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Plus, Save, X, GripVertical } from "lucide-react";
import { useSalesFunnelContext } from "../SalesFunnelProvider";
import { toast } from "sonner";

interface FunnelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FunnelConfigModal = ({ isOpen, onClose }: FunnelConfigModalProps) => {
  const { columns, updateColumn, deleteColumn, addColumn } = useSalesFunnelContext();
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState("");
  const [newStageColor, setNewStageColor] = useState("#3b82f6");
  const [editTitle, setEditTitle] = useState("");
  const [editColor, setEditColor] = useState("");

  // Filtrar apenas etapas editáveis (não GANHO nem PERDIDO)
  const editableStages = columns.filter(col => 
    col.title !== "GANHO" && col.title !== "PERDIDO"
  );

  const handleStartEdit = (stage: any) => {
    setEditingStage(stage.id);
    setEditTitle(stage.title);
    setEditColor(stage.color || "#3b82f6");
  };

  const handleSaveEdit = async () => {
    if (!editingStage) return;
    
    const stage = columns.find(col => col.id === editingStage);
    if (!stage) return;

    try {
      await updateColumn({
        ...stage,
        title: editTitle,
        color: editColor
      });
      setEditingStage(null);
      toast.success("Etapa atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar etapa");
    }
  };

  const handleCancelEdit = () => {
    setEditingStage(null);
    setEditTitle("");
    setEditColor("");
  };

  const handleCreateStage = async () => {
    if (!newStageTitle.trim()) return;

    try {
      await addColumn(newStageTitle);
      setNewStageTitle("");
      setNewStageColor("#3b82f6");
      setIsCreating(false);
      toast.success("Nova etapa criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar etapa");
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta etapa?")) return;

    try {
      await deleteColumn(stageId);
      toast.success("Etapa excluída com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir etapa");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white/10 backdrop-blur-xl border border-white/20 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Configurar Funil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de Etapas */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Etapas do Funil</h3>
            
            {editableStages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20">
                <div className="cursor-move">
                  <GripVertical className="w-4 h-4 text-gray-500" />
                </div>
                
                {editingStage === stage.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1"
                    />
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-10 h-10 rounded border border-white/20"
                    />
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-1">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="font-medium">{stage.title}</span>
                      <Badge variant="secondary" className="ml-2">
                        {stage.leads?.length || 0} leads
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(stage)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {!stage.isFixed && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteStage(stage.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Criar Nova Etapa */}
          {isCreating ? (
            <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <Label>Nova Etapa</Label>
              <div className="flex gap-2">
                <Input
                  value={newStageTitle}
                  onChange={(e) => setNewStageTitle(e.target.value)}
                  placeholder="Nome da etapa"
                  className="flex-1"
                />
                <input
                  type="color"
                  value={newStageColor}
                  onChange={(e) => setNewStageColor(e.target.value)}
                  className="w-12 h-10 rounded border border-white/20"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateStage} className="bg-gradient-to-r from-ticlin to-ticlin-dark text-black">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsCreating(false);
                  setNewStageTitle("");
                  setNewStageColor("#3b82f6");
                }}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsCreating(true)}
              className="w-full bg-gradient-to-r from-ticlin to-ticlin-dark text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Etapa
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
