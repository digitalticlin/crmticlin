import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/ui/tag-badge";
import { KanbanTag } from "@/types/kanban";
import { Plus, Check } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ChatHeaderTagsProps {
  leadTags: KanbanTag[];
  availableTags: KanbanTag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  isLoading?: boolean;
}

// Cores predefinidas para tags
const PRESET_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red 
  "#10b981", // green
  "#f59e0b", // yellow
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#ec4899", // pink
  "#6b7280"  // gray
];

export const ChatHeaderTags = ({
  leadTags,
  availableTags,
  onAddTag,
  onRemoveTag,
  isLoading = false
}: ChatHeaderTagsProps) => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [localAvailableTags, setLocalAvailableTags] = useState<KanbanTag[]>(availableTags);
  
  // 🎯 ESTADO PARA SELEÇÃO EM LOTE - sem refresh automático
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [pendingChanges, setPendingChanges] = useState(false);

  // 🔄 Sincronizar tags disponíveis
  useEffect(() => {
    setLocalAvailableTags(availableTags);
  }, [availableTags]);

  // 🔄 Inicializar tags selecionadas quando modal abrir
  useEffect(() => {
    if (isModalOpen) {
      const currentTagIds = new Set(leadTags.map(tag => tag.id));
      setSelectedTagIds(currentTagIds);
      setPendingChanges(false);
      console.log('[ChatHeaderTags] 🔄 Modal aberto, tags atuais:', Array.from(currentTagIds));
    }
  }, [isModalOpen, leadTags]);

  // 🆕 Função para criar nova tag
  const handleCreateTag = async () => {
    if (!newTagName.trim() || !user?.id) {
      toast.error("Nome da tag é obrigatório");
      return;
    }

    try {
      console.log('[ChatHeaderTags] 🆕 Criando nova tag:', { name: newTagName, color: newTagColor });

      const { data: newTag, error } = await supabase
        .from('tags')
        .insert([{
          name: newTagName.trim(),
          color: newTagColor,
          created_by_user_id: user.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista local
      setLocalAvailableTags(prev => [...prev, newTag]);

      // Adicionar a tag à seleção local (sem aplicar ainda)
      setSelectedTagIds(prev => new Set([...prev, newTag.id]));
      setPendingChanges(true);

      // Reset form
      setNewTagName("");
      setNewTagColor(PRESET_COLORS[0]);
      setIsCreatingTag(false);

      toast.success("Tag criada! Feche o modal para aplicar as mudanças.");

    } catch (error: any) {
      console.error('[ChatHeaderTags] ❌ Erro ao criar tag:', error);
      toast.error("Erro ao criar tag");
    }
  };

  // 🎯 Verificar se tag está selecionada localmente
  const isTagSelected = (tagId: string) => {
    return selectedTagIds.has(tagId);
  };

  // 🔄 Toggle tag local (sem refresh)
  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(tagId)) {
        newSelection.delete(tagId);
      } else {
        newSelection.add(tagId);
      }
      
      // Verificar se há mudanças pendentes
      const originalTagIds = new Set(leadTags.map(tag => tag.id));
      const hasChanges = newSelection.size !== originalTagIds.size || 
        [...newSelection].some(id => !originalTagIds.has(id)) ||
        [...originalTagIds].some(id => !newSelection.has(id));
      
      setPendingChanges(hasChanges);
      
      console.log('[ChatHeaderTags] 🎯 Tag toggle local:', {
        tagId,
        selected: newSelection.has(tagId),
        totalSelected: newSelection.size,
        hasChanges
      });
      
      return newSelection;
    });
  };

  // 🔄 Aplicar mudanças ao fechar modal
  const handleCloseModal = async () => {
    if (pendingChanges) {
      console.log('[ChatHeaderTags] 💾 Aplicando mudanças pendentes...');
      
      const originalTagIds = new Set(leadTags.map(tag => tag.id));
      const currentTagIds = selectedTagIds;
      
      // Tags para adicionar
      const tagsToAdd = [...currentTagIds].filter(id => !originalTagIds.has(id));
      // Tags para remover
      const tagsToRemove = [...originalTagIds].filter(id => !currentTagIds.has(id));
      
      console.log('[ChatHeaderTags] 📊 Mudanças:', {
        toAdd: tagsToAdd.length,
        toRemove: tagsToRemove.length
      });
      
      // Aplicar mudanças sequencialmente
      for (const tagId of tagsToAdd) {
        onAddTag(tagId);
      }
      
      for (const tagId of tagsToRemove) {
        onRemoveTag(tagId);
      }
      
      // ✅ EVENTOS JÁ DISPARADOS: onAddTag e onRemoveTag (useLeadTags) já disparam os eventos necessários
      // Não é necessário disparar eventos adicionais aqui pois useLeadTags já faz isso
      
      toast.success(`Mudanças aplicadas! ${tagsToAdd.length} adicionadas, ${tagsToRemove.length} removidas.`);
    }
    
    setIsModalOpen(false);
    setIsCreatingTag(false);
    setNewTagName("");
    setNewTagColor(PRESET_COLORS[0]);
    setPendingChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <>
      <div className="px-4 py-2 flex items-center gap-2 border-t border-white/20">
        <div className="flex flex-wrap gap-1 flex-1">
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : leadTags.length > 0 ? (
            leadTags.map((tag) => (
              <TagBadge
                key={tag.id}
                tag={tag}
                onClick={() => {
                  console.log('[ChatHeaderTags] 🗑️ Removendo tag:', tag.name);
                  onRemoveTag(tag.id);
                }}
                showRemoveIcon
                size="sm"
              />
            ))
          ) : (
            <span className="text-xs text-gray-500">Sem tags</span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-white/20"
          onClick={() => {
            console.log('[ChatHeaderTags] ➕ Abrindo modal de seleção de tags...');
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Modal de Seleção de Tags - Design Branco com Glassmorphism */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl text-gray-900">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              🏷️ Suas Etiquetas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tags Existentes */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Etiquetas ({localAvailableTags.length})
                {pendingChanges && (
                  <span className="ml-2 text-xs text-blue-600 font-semibold">
                    • Mudanças pendentes
                  </span>
                )}
              </h3>
              
              {localAvailableTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {localAvailableTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleToggleTag(tag.id)}
                      className={cn(
                        "relative px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                        "hover:scale-105 cursor-pointer border shadow-sm",
                        isTagSelected(tag.id)
                          ? "bg-gray-100/80 border-gray-300 text-gray-900 shadow-md"
                          : "bg-white/60 border-gray-200 text-gray-700 hover:bg-gray-50/80"
                      )}
                      style={{ 
                        backgroundColor: isTagSelected(tag.id) ? tag.color + "20" : "rgba(255,255,255,0.6)",
                        borderColor: isTagSelected(tag.id) ? tag.color + "60" : "rgba(229,231,235,1)"
                      }}
                    >
                      {tag.name}
                      {isTagSelected(tag.id) && (
                        <Check className="w-3 h-3 absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhuma etiqueta disponível</p>
              )}
            </div>

            {/* Seção Nova Etiqueta */}
            <div className="border-t border-gray-200/50 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Nova Etiqueta</h3>
              
              {!isCreatingTag ? (
                <button
                  onClick={() => setIsCreatingTag(true)}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-all duration-200 text-sm font-medium bg-white/40 hover:bg-white/60"
                >
                  + Nova Etiqueta
                </button>
              ) : (
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Nome da etiqueta"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="bg-white/70 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white/90 focus:border-gray-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateTag();
                      } else if (e.key === 'Escape') {
                        setIsCreatingTag(false);
                        setNewTagName("");
                      }
                    }}
                    autoFocus
                  />
                  
                  {/* Seletor de Cores */}
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 shadow-sm",
                          newTagColor === color ? "border-gray-600 scale-110 shadow-md" : "border-gray-300"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {/* Preview */}
                  {newTagName && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Preview:</span>
                      <div
                        className="px-2 py-1 rounded-full text-xs font-medium border shadow-sm"
                        style={{ 
                          backgroundColor: newTagColor + "20", 
                          color: "#374151",
                          borderColor: newTagColor + "60"
                        }}
                      >
                        {newTagName}
                      </div>
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim()}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    >
                      Criar
                    </Button>
                    <Button
                      onClick={() => {
                        setIsCreatingTag(false);
                        setNewTagName("");
                      }}
                      size="sm"
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white/60"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-200/50">
            <p className="text-xs text-gray-500 text-center">
              💡 Dica: Selecione quantas etiquetas precisar e feche o modal para aplicar
            </p>
            {pendingChanges && (
              <p className="text-xs text-blue-600 text-center mt-1 font-medium">
                ⚡ Mudanças serão aplicadas ao fechar o modal
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 