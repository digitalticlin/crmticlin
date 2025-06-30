
import { useCallback } from "react";
import { KanbanLead } from "@/types/kanban";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseDragSyncProps {
  onRevert: (leadId: string, originalColumnId: string) => void;
}

export const useDragSync = ({ onRevert }: UseDragSyncProps) => {
  
  const syncToDatabase = useCallback(async (
    lead: KanbanLead, 
    newColumnId: string, 
    originalColumnId: string
  ) => {
    try {
      console.log('[DragSync] 🔄 Sincronizando com Supabase:', {
        leadId: lead.id,
        from: originalColumnId,
        to: newColumnId
      });

      const { error } = await supabase
        .from("leads")
        .update({ 
          kanban_stage_id: newColumnId,
          updated_at: new Date().toISOString()
        })
        .eq("id", lead.id);

      if (error) {
        console.error('[DragSync] ❌ Erro no Supabase:', error);
        
        // Revert UI em caso de erro
        onRevert(lead.id, originalColumnId);
        toast.error("Erro ao salvar. Operação revertida.");
        return false;
      }

      console.log('[DragSync] ✅ Sincronização concluída');
      return true;

    } catch (error) {
      console.error('[DragSync] ❌ Erro crítico:', error);
      onRevert(lead.id, originalColumnId);
      toast.error("Erro de conexão. Operação revertida.");
      return false;
    }
  }, [onRevert]);

  return { syncToDatabase };
};
