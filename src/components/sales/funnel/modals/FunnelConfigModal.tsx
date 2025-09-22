import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StagesList } from "./config/StagesList";
import { CreateStageForm } from "./config/CreateStageForm";
import { useFunnelStages } from "@/hooks/salesFunnel/stages/useFunnelStages";
import { useStageManagement } from "@/hooks/salesFunnel/useStageManagement";
import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface FunnelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFunnelId?: string;
}

export const FunnelConfigModal = ({ isOpen, onClose, selectedFunnelId }: FunnelConfigModalProps) => {
  const { user } = useAuth();
  const [funnelName, setFunnelName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const { stages, refetch: refetchStages } = useFunnelStages({
    funnelId: selectedFunnelId || null,
    enabled: !!selectedFunnelId
  });

  const { addColumn, updateColumn, deleteColumn } = useStageManagement();

  // Buscar dados do funil quando o modal abrir
  useEffect(() => {
    if (isOpen && selectedFunnelId) {
      const fetchFunnelData = async () => {
        try {
          const { data: funnel, error } = await supabase
            .from('funnels')
            .select('name')
            .eq('id', selectedFunnelId)
            .single();

          if (error) {
            console.error('Erro ao buscar dados do funil:', error);
            return;
          }

          setFunnelName(funnel?.name || '');
        } catch (error) {
          console.error('Erro ao buscar funil:', error);
        }
      };

      fetchFunnelData();
    }
  }, [isOpen, selectedFunnelId]);

  // Converter stages para formato de columns para compatibilidade
  const columns = stages?.map(stage => ({
    id: stage.id,
    title: stage.title,
    color: stage.color || "#e0e0e0",
    isFixed: stage.is_fixed || false,
    leads: []
  })) || [];

  // Wrapper functions to ensure proper async handling
  const handleUpdateStage = useCallback(async (stage: any) => {
    await updateColumn(stage.id, {
      title: stage.title,
      color: stage.color
    });
    await refetchStages();
  }, [updateColumn, refetchStages]);

  const handleDeleteStage = useCallback(async (stageId: string) => {
    await deleteColumn(stageId);
    await refetchStages();
  }, [deleteColumn, refetchStages]);

  const handleCreateStage = useCallback(async (title: string, color?: string) => {
    if (!selectedFunnelId) return;
    await addColumn(title, color || "#3b82f6", selectedFunnelId);
    await refetchStages();
  }, [addColumn, selectedFunnelId, refetchStages]);

  // Função para atualizar o nome do funil
  const handleUpdateFunnelName = async () => {
    if (!selectedFunnelId || !user?.id || !funnelName.trim()) {
      toast.error('Nome do funil é obrigatório');
      return;
    }

    setIsUpdatingName(true);
    try {
      const { error } = await supabase
        .from('funnels')
        .update({ name: funnelName.trim() })
        .eq('id', selectedFunnelId)
        .eq('created_by_user_id', user.id); // Segurança: só pode alterar próprios funis

      if (error) throw error;

      toast.success('Nome do funil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar nome do funil:', error);
      toast.error('Erro ao atualizar nome do funil');
    } finally {
      setIsUpdatingName(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-800 text-center">
            Configurar Funil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campo discreto para editar nome do funil */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center gap-3">
              <Label htmlFor="funnel-name" className="text-sm text-gray-600 min-w-0">
                Nome:
              </Label>
              <Input
                id="funnel-name"
                value={funnelName}
                onChange={(e) => setFunnelName(e.target.value)}
                placeholder="Nome do funil..."
                className="flex-1 h-8 text-sm border-gray-200 rounded-lg"
              />
              <Button
                onClick={handleUpdateFunnelName}
                disabled={isUpdatingName || !funnelName.trim()}
                variant="ghost"
                size="sm"
                className="text-xs text-gray-600 hover:text-gray-800 px-2"
              >
                {isUpdatingName ? '...' : 'Salvar'}
              </Button>
            </div>
          </div>

          <StagesList
            stages={columns}
            onUpdateStage={handleUpdateStage}
            onDeleteStage={handleDeleteStage}
            onRefreshStages={refetchStages}
          />

          <CreateStageForm onCreateStage={handleCreateStage} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
