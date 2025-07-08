import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/ui/tag-badge";
import { KanbanTag } from "@/types/kanban";
import { Plus } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SimplifiedTagModal } from "@/components/sales/tags/SimplifiedTagModal";
import { useSimplifiedTagModal } from "@/hooks/salesFunnel/useSimplifiedTagModal";
import { cn } from "@/lib/utils";

interface ChatHeaderTagsProps {
  leadTags: KanbanTag[];
  availableTags: KanbanTag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  isLoading?: boolean;
}

export const ChatHeaderTags = ({
  leadTags,
  availableTags,
  onAddTag,
  onRemoveTag,
  isLoading = false
}: ChatHeaderTagsProps) => {
  const {
    isOpen: isTagModalOpen,
    setIsOpen: setIsTagModalOpen,
    tags: allTags,
    isLoading: isTagsLoading,
    handleCreateTag,
    handleUpdateTag,
    handleDeleteTag,
  } = useSimplifiedTagModal();

  // 🚀 SINCRONIZAÇÃO MELHORADA - Atualizar quando modal for fechado
  const handleModalClose = (open: boolean) => {
    setIsTagModalOpen(open);
    
    if (!open) {
      // Quando modal fechar, disparar eventos de refresh
      console.log('[ChatHeaderTags] 🔄 Modal fechado, disparando eventos de refresh...');
      
      // Disparar evento para atualizar contatos do WhatsApp
      window.dispatchEvent(new CustomEvent('refreshWhatsAppContacts'));
      
      // Disparar evento específico para tags
      window.dispatchEvent(new CustomEvent('refreshLeadTags'));
    }
  };

  // 🔍 LOG DE DEBUG PARA SINCRONIZAÇÃO
  useEffect(() => {
    console.log('[ChatHeaderTags] 🔍 Estado das tags:', {
      leadTags: leadTags.length,
      availableTags: availableTags.length,
      allTags: allTags.length,
      isLoading,
      isTagsLoading
    });
  }, [leadTags, availableTags, allTags, isLoading, isTagsLoading]);

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
            console.log('[ChatHeaderTags] ➕ Abrindo modal de tags...');
            setIsTagModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Modal de Tags Simplificado - mesmo usado no funil de vendas */}
      <SimplifiedTagModal
        isOpen={isTagModalOpen}
        onOpenChange={handleModalClose}
        tags={allTags}
        onCreateTag={(name, color) => {
          console.log('[ChatHeaderTags] 🆕 Criando nova tag:', { name, color });
          handleCreateTag(name, color);
        }}
        onUpdateTag={(id, name, color) => {
          console.log('[ChatHeaderTags] ✏️ Atualizando tag:', { id, name, color });
          handleUpdateTag(id, name, color);
        }}
        onDeleteTag={(id) => {
          console.log('[ChatHeaderTags] 🗑️ Deletando tag:', id);
          handleDeleteTag(id);
        }}
      />
    </>
  );
}; 