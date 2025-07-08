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

  // 🔄 Sincronizar tags disponíveis
  useEffect(() => {
    setLocalAvailableTags(availableTags);
  }, [availableTags]);

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

      // Adicionar a tag ao lead automaticamente
      onAddTag(newTag.id);

      // Reset form
      setNewTagName("");
      setNewTagColor(PRESET_COLORS[0]);
      setIsCreatingTag(false);

      // Disparar eventos de sincronização
      window.dispatchEvent(new CustomEvent('refreshWhatsAppContacts'));
      window.dispatchEvent(new CustomEvent('refreshLeadTags'));

      toast.success("Tag criada e adicionada com sucesso!");

    } catch (error: any) {
      console.error('[ChatHeaderTags] ❌ Erro ao criar tag:', error);
      toast.error("Erro ao criar tag");
    }
  };

  // 🎯 Verificar se tag está selecionada
  const isTagSelected = (tagId: string) => {
    return leadTags.some(tag => tag.id === tagId);
  };

  // 🔄 Toggle tag (adicionar/remover)
  const handleToggleTag = (tagId: string) => {
    if (isTagSelected(tagId)) {
      onRemoveTag(tagId);
    } else {
      onAddTag(tagId);
    }
  };

  // 🔄 Fechar modal e disparar eventos
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsCreatingTag(false);
    setNewTagName("");
    setNewTagColor(PRESET_COLORS[0]);
    
    // Disparar eventos de sincronização
    window.dispatchEvent(new CustomEvent('refreshWhatsAppContacts'));
    window.dispatchEvent(new CustomEvent('refreshLeadTags'));
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

      {/* Modal de Seleção de Tags - Estilo da imagem */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 text-white">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              🏷️ Suas Etiquetas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tags Existentes */}
            <div>
              <h3 className="text-sm font-medium text-white/80 mb-3">
                Etiquetas ({localAvailableTags.length})
              </h3>
              
              {localAvailableTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {localAvailableTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleToggleTag(tag.id)}
                      className={cn(
                        "relative px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                        "hover:scale-105 cursor-pointer border",
                        isTagSelected(tag.id)
                          ? "bg-white/20 border-white/40 text-white shadow-lg"
                          : "bg-white/10 border-white/20 text-white/70 hover:bg-white/15"
                      )}
                      style={{ 
                        backgroundColor: isTagSelected(tag.id) ? tag.color + "40" : tag.color + "20",
                        borderColor: tag.color + "60"
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
                <p className="text-white/60 text-sm">Nenhuma etiqueta disponível</p>
              )}
            </div>

            {/* Seção Nova Etiqueta */}
            <div className="border-t border-white/20 pt-4">
              <h3 className="text-sm font-medium text-white/80 mb-3">Nova Etiqueta</h3>
              
              {!isCreatingTag ? (
                <button
                  onClick={() => setIsCreatingTag(true)}
                  className="w-full py-2 border-2 border-dashed border-white/30 rounded-lg text-white/60 hover:text-white hover:border-white/50 transition-all duration-200 text-sm font-medium"
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
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15"
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
                          "w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110",
                          newTagColor === color ? "border-white scale-110" : "border-white/30"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {/* Preview */}
                  {newTagName && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/60">Preview:</span>
                      <div
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: newTagColor + "40", 
                          color: "white",
                          border: `1px solid ${newTagColor}60`
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
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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
                      className="border-white/20 text-white/70 hover:bg-white/10"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-white/20">
            <p className="text-xs text-white/50 text-center">
              💡 Dica: Clique em uma etiqueta para adicioná-la ou removê-la
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 