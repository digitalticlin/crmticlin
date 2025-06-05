
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Plus, Save, X } from "lucide-react";
import { useSalesFunnelContext } from "../SalesFunnelProvider";
import { useTagDatabase } from "@/hooks/salesFunnel/useTagDatabase";
import { useCompanyData } from "@/hooks/useCompanyData";
import { toast } from "sonner";

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TagManagementModal = ({ isOpen, onClose }: TagManagementModalProps) => {
  const { availableTags } = useSalesFunnelContext();
  const { companyId } = useCompanyData();
  const { createTag, updateTag, deleteTag, loadTags } = useTagDatabase(companyId);
  
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleStartEdit = (tag: any) => {
    setEditingTag(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const handleSaveEdit = async () => {
    if (!editingTag || !editName.trim()) return;
    
    try {
      await updateTag(editingTag, editName, editColor);
      setEditingTag(null);
      await loadTags();
      toast.success("Etiqueta atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar etiqueta");
    }
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditName("");
    setEditColor("");
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      await createTag(newTagName, newTagColor);
      setNewTagName("");
      setNewTagColor("#3b82f6");
      setIsCreating(false);
      await loadTags();
      toast.success("Nova etiqueta criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar etiqueta");
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta etiqueta?")) return;

    try {
      await deleteTag(tagId);
      await loadTags();
      toast.success("Etiqueta excluída com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir etiqueta");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white/10 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Gerenciar Etiquetas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de Tags */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableTags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20">
                {editingTag === tag.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
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
                    <Badge 
                      style={{ backgroundColor: tag.color, color: 'white' }}
                      className="px-3 py-1"
                    >
                      {tag.name}
                    </Badge>
                    <div className="flex items-center gap-1 ml-auto">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(tag)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Criar Nova Tag */}
          {isCreating ? (
            <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <Label>Nova Etiqueta</Label>
              <div className="flex gap-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Nome da etiqueta"
                  className="flex-1"
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-12 h-10 rounded border border-white/20"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateTag} className="bg-gradient-to-r from-ticlin to-ticlin-dark text-black">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsCreating(false);
                  setNewTagName("");
                  setNewTagColor("#3b82f6");
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
              Nova Etiqueta
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
