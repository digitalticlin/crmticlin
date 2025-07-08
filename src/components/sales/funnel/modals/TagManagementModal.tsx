import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Tags, Trash2, Edit2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TagBadge } from "@/components/ui/tag-badge";
import { KanbanTag } from "@/types/kanban";

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTags?: KanbanTag[];
  onTagsChange: () => Promise<void>;
}

// Cores predefinidas para as tags - cores mais vibrantes
const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"
];

export const TagManagementModal = ({ 
  isOpen, 
  onClose, 
  availableTags = [], 
  onTagsChange 
}: TagManagementModalProps) => {
  const [tags, setTags] = useState<KanbanTag[]>(availableTags);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Atualizar tags quando availableTags mudar
  useState(() => {
    setTags(availableTags);
  });

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error("O nome da etiqueta não pode estar vazio");
      return;
    }

    if (tags.some(tag => tag.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      toast.error("Já existe uma etiqueta com este nome");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implementar criação real no banco
      const newTag: KanbanTag = {
        id: Date.now().toString(), // Temporário
        name: newTagName.trim(),
        color: newTagColor,
      };
      
      setTags(prev => [...prev, newTag]);
      setNewTagName("");
      setNewTagColor(PRESET_COLORS[0]);
      setIsCreating(false);
      
      console.log('Criando tag:', newTag);
      await onTagsChange();
      toast.success("Etiqueta criada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar etiqueta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTag = async (tagId: string) => {
    if (!editTagName.trim()) {
      toast.error("O nome da etiqueta não pode estar vazio");
      return;
    }

    const otherTags = tags.filter(tag => tag.id !== tagId);
    if (otherTags.some(tag => tag.name.toLowerCase() === editTagName.trim().toLowerCase())) {
      toast.error("Já existe uma etiqueta com este nome");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implementar edição real no banco
      setTags(prev => prev.map(tag => 
        tag.id === tagId 
          ? { ...tag, name: editTagName.trim(), color: editTagColor }
          : tag
      ));
      
      setEditingId(null);
      console.log('Editando tag:', tagId, { name: editTagName, color: editTagColor });
      await onTagsChange();
      toast.success("Etiqueta atualizada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar etiqueta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a etiqueta "${tagName}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implementar exclusão real no banco
      setTags(prev => prev.filter(tag => tag.id !== tagId));
      
      console.log('Excluindo tag:', tagId);
      await onTagsChange();
      toast.success("Etiqueta excluída com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir etiqueta");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (tag: KanbanTag) => {
    setEditingId(tag.id);
    setEditTagName(tag.name);
    setEditTagColor(tag.color);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTagName("");
    setEditTagColor("");
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewTagName("");
    setNewTagColor(PRESET_COLORS[0]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto bg-white/35 backdrop-blur-xl border border-white/30 shadow-glass-lg rounded-3xl">
        <DialogHeader className="pb-6 border-b border-white/20">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-300/30">
              <Tags className="h-6 w-6 text-blue-700" />
            </div>
            Gerenciar Etiquetas
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Seção de criar nova etiqueta */}
          <div className="bg-white/40 backdrop-blur-lg border border-white/40 rounded-2xl p-6 shadow-glass transition-all duration-300 hover:bg-white/50 hover:shadow-glass-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm">
                  <Plus className="h-4 w-4 text-blue-700" />
                </div>
                Nova Etiqueta
              </h3>
              {!isCreating && (
                <Button
                  onClick={() => setIsCreating(true)}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-600/90 hover:to-blue-700/90 text-white backdrop-blur-sm border border-blue-400/30 shadow-glass transition-all duration-200 hover:shadow-glass-lg hover:scale-105"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              )}
            </div>

            {isCreating && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="new-tag-name" className="text-sm font-medium text-gray-700 mb-2 block">
                    Nome da Etiqueta
                  </Label>
                  <Input
                    id="new-tag-name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Digite o nome da etiqueta"
                    disabled={isLoading}
                    className="bg-white/60 backdrop-blur-sm border-white/40 focus:bg-white/80 focus:border-blue-400/50 shadow-glass"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Cor da Etiqueta</Label>
                  <div className="space-y-4">
                    {/* Preview da tag */}
                    <div className="flex items-center gap-4 p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-white/30">
                      <span className="text-sm text-gray-700 font-medium">Preview:</span>
                      <TagBadge 
                        tag={{ id: 'preview', name: newTagName || 'Exemplo', color: newTagColor }} 
                        size="md"
                      />
                    </div>
                    
                    {/* Seletor de cor manual */}
                    <div className="flex items-center gap-4 p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-white/30">
                      <span className="text-sm text-gray-700 font-medium">Personalizada:</span>
                      <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-12 h-10 rounded-xl border-2 border-white/50 cursor-pointer shadow-glass hover:shadow-glass-lg transition-all duration-200"
                        disabled={isLoading}
                      />
                    </div>
                    
                    {/* Cores predefinidas */}
                    <div className="p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-white/30">
                      <span className="text-sm text-gray-700 font-medium block mb-3">Cores predefinidas:</span>
                      <div className="grid grid-cols-8 gap-3">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewTagColor(color)}
                            className={cn(
                              "w-10 h-10 rounded-xl border-2 shadow-glass hover:scale-110 hover:shadow-glass-lg transition-all duration-200",
                              newTagColor === color ? "border-gray-800 ring-2 ring-blue-500/50 scale-110" : "border-white/60"
                            )}
                            style={{ backgroundColor: color }}
                            disabled={isLoading}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <Button
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || isLoading}
                    size="sm"
                    className="bg-gradient-to-r from-green-500/80 to-green-600/80 hover:from-green-600/90 hover:to-green-700/90 text-white backdrop-blur-sm border border-green-400/30 shadow-glass hover:shadow-glass-lg hover:scale-105"
                  >
                    {isLoading ? "Criando..." : "Criar Etiqueta"}
                  </Button>
                  <Button
                    onClick={cancelCreating}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    className="bg-white/60 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white/80 shadow-glass hover:shadow-glass-lg hover:scale-105"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Lista de etiquetas existentes */}
          <div className="bg-white/40 backdrop-blur-lg border border-white/40 rounded-2xl p-6 shadow-glass transition-all duration-300 hover:bg-white/50 hover:shadow-glass-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-gray-500/20 to-gray-600/20 backdrop-blur-sm">
                <Tags className="h-4 w-4 text-gray-700" />
              </div>
              Etiquetas Existentes ({tags.length})
            </h3>

            {tags.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 rounded-full bg-gradient-to-br from-gray-100/80 to-gray-200/80 backdrop-blur-sm w-20 h-20 mx-auto mb-5 flex items-center justify-center shadow-glass">
                  <Tags className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-700 font-semibold text-lg mb-2">Nenhuma etiqueta criada ainda</p>
                <p className="text-sm text-gray-600">
                  Clique em "Adicionar" para criar sua primeira etiqueta
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-5 p-5 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/40 hover:bg-white/70 hover:shadow-glass transition-all duration-300 shadow-glass group"
                  >
                    {/* Preview da tag */}
                    <div className="flex-shrink-0">
                      {editingId === tag.id ? (
                        <TagBadge 
                          tag={{ id: 'editing', name: editTagName || tag.name, color: editTagColor || tag.color }} 
                          size="md"
                        />
                      ) : (
                        <TagBadge tag={tag} size="md" />
                      )}
                    </div>

                    {/* Informações da tag */}
                    <div className="flex-1 min-w-0">
                      {editingId === tag.id ? (
                        <div className="space-y-4">
                          <Input
                            value={editTagName}
                            onChange={(e) => setEditTagName(e.target.value)}
                            placeholder="Nome da etiqueta"
                            className="text-sm bg-white/60 backdrop-blur-sm border-white/40 focus:bg-white/80 shadow-glass"
                            disabled={isLoading}
                          />
                          <div className="flex items-center gap-4 p-3 bg-white/40 backdrop-blur-sm rounded-xl border border-white/30">
                            <span className="text-xs text-gray-700 font-medium">Cor:</span>
                            <input
                              type="color"
                              value={editTagColor}
                              onChange={(e) => setEditTagColor(e.target.value)}
                              className="w-8 h-8 rounded-lg border-2 border-white/50 cursor-pointer shadow-glass"
                              disabled={isLoading}
                            />
                            <div className="flex gap-2">
                              {PRESET_COLORS.slice(0, 8).map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setEditTagColor(color)}
                                  className={cn(
                                    "w-7 h-7 rounded-lg border-2 hover:scale-110 transition-all duration-200 shadow-glass",
                                    editTagColor === color ? "border-gray-800 scale-110" : "border-white/60"
                                  )}
                                  style={{ backgroundColor: color }}
                                  disabled={isLoading}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          {/* Espaço vazio para manter o layout - TagBadge à esquerda já mostra tudo */}
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      {editingId === tag.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTag(tag.id)}
                            className="h-10 w-10 p-0 text-green-600 hover:text-green-700 hover:bg-green-50/80 backdrop-blur-sm border border-green-200/50 shadow-glass hover:shadow-glass-lg hover:scale-105"
                            disabled={isLoading}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-10 w-10 p-0 text-gray-500 hover:text-gray-600 hover:bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 shadow-glass hover:shadow-glass-lg hover:scale-105"
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(tag)}
                            className="h-10 w-10 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 shadow-glass hover:shadow-glass-lg hover:scale-105"
                            disabled={isLoading}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTag(tag.id, tag.name)}
                            className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50/80 backdrop-blur-sm border border-red-200/50 shadow-glass hover:shadow-glass-lg hover:scale-105"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 