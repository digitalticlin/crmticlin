import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StageConfigCard } from "./StageConfigCard";
import { StageConfigModal } from "./StageConfigModal";
import { AIAgent } from "@/types/aiAgent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target, ArrowLeft, RefreshCw } from "lucide-react";

interface FunnelStage {
  id: string;
  title: string;
  color: string;
  order_position: number;
  ai_stage_description: string;
  ai_notify_enabled: boolean;
  notify_phone: string;
  funnel_id: string;
}

interface FunnelInfo {
  id: string;
  name: string;
}

interface FunnelStagesConfigurationProps {
  agent?: AIAgent | null;
  selectedFunnelId?: string;
  onGoToBasicTab: () => void;
}

export const FunnelStagesConfiguration = ({ 
  agent, 
  selectedFunnelId, 
  onGoToBasicTab 
}: FunnelStagesConfigurationProps) => {
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [funnelInfo, setFunnelInfo] = useState<FunnelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingStage, setEditingStage] = useState<FunnelStage | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);

  // Carregar informações do funil e seus estágios
  useEffect(() => {
    if (selectedFunnelId) {
      loadFunnelStages(selectedFunnelId);
    } else {
      setFunnelStages([]);
      setFunnelInfo(null);
    }
  }, [selectedFunnelId]);

  const loadFunnelStages = async (funnelId: string) => {
    console.log('🔄 Carregando estágios do funil:', funnelId);
    setIsLoading(true);

    try {
      // Buscar informações do funil
      const { data: funnelData, error: funnelError } = await supabase
        .from('funnels')
        .select('id, name')
        .eq('id', funnelId)
        .single();

      if (funnelError) throw funnelError;

      setFunnelInfo(funnelData);

      // Buscar estágios do funil
      const { data: stagesData, error: stagesError } = await supabase
        .from('kanban_stages')
        .select(`
          id, 
          title, 
          color, 
          order_position,
          ai_stage_description,
          ai_notify_enabled,
          notify_phone,
          funnel_id
        `)
        .eq('funnel_id', funnelId)
        .order('order_position', { ascending: true });

      if (stagesError) throw stagesError;

      console.log('✅ Estágios carregados:', stagesData?.length || 0);
      setFunnelStages(stagesData || []);

    } catch (error) {
      console.error('❌ Erro ao carregar estágios:', error);
      toast.error('Erro ao carregar estágios do funil');
      setFunnelStages([]);
      setFunnelInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageUpdate = async (updatedStage: FunnelStage) => {
    console.log('💾 Atualizando estágio:', updatedStage.id);

    try {
      const { error } = await supabase
        .from('kanban_stages')
        .update({
          ai_stage_description: updatedStage.ai_stage_description,
          ai_notify_enabled: updatedStage.ai_notify_enabled,
          notify_phone: updatedStage.notify_phone,
        })
        .eq('id', updatedStage.id);

      if (error) throw error;

      // Atualizar estado local
      setFunnelStages(prev => 
        prev.map(stage => 
          stage.id === updatedStage.id ? updatedStage : stage
        )
      );

      toast.success(`Estágio "${updatedStage.title}" atualizado`, {
        description: '💾 Configurações salvas com sucesso',
        duration: 2000,
      });

      console.log('✅ Estágio atualizado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao atualizar estágio:', error);
      toast.error('Erro ao salvar configuração do estágio');
      throw error;
    }
  };

  const handleQuickNotificationToggle = async (stageId: string, enabled: boolean) => {
    console.log(`🔔 Toggle notificação rápida: ${stageId} = ${enabled}`);

    const stage = funnelStages.find(s => s.id === stageId);
    if (!stage) return;

    const updatedStage = { ...stage, ai_notify_enabled: enabled };

    try {
      await handleStageUpdate(updatedStage);
    } catch (error) {
      console.error('❌ Erro no toggle de notificação:', error);
    }
  };

  const openStageModal = (stage: FunnelStage) => {
    console.log('🔧 Abrindo modal para configurar estágio:', stage.title);
    setEditingStage(stage);
    setShowStageModal(true);
  };

  const closeStageModal = () => {
    setEditingStage(null);
    setShowStageModal(false);
  };

  // Estado: Nenhum funil selecionado
  if (!selectedFunnelId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-4 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/60 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Target className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800">
              Selecione um Funil
            </h3>
          </div>
          <p className="text-sm text-yellow-700 mb-4">
            Para configurar os estágios, primeiro selecione um funil na <strong>Aba 1</strong>.
          </p>
          <Button 
            onClick={onGoToBasicTab}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ir para Aba 1
          </Button>
        </div>
      </div>
    );
  }

  // Estado: Carregando
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-yellow-500" />
              Carregando estágios...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white/20 rounded-lg animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado: Funil sem estágios
  if (funnelStages.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-yellow-500" />
                {funnelInfo?.name || 'Funil Selecionado'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedFunnelId && loadFunnelStages(selectedFunnelId)}
                className="bg-white/40"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                📋 Este funil não possui estágios cadastrados ainda.
              </p>
              <p className="text-sm text-gray-500">
                Primeiro cadastre os estágios no gerenciamento de funil.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado: Exibir estágios
  return (
    <div className="space-y-4">
      {/* Header com informações do funil */}
      <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-yellow-500" />
              {funnelInfo?.name || 'Funil Selecionado'}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 bg-white/40 px-3 py-1 rounded-full">
                📊 {funnelStages.length} estágio{funnelStages.length !== 1 ? 's' : ''}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedFunnelId && loadFunnelStages(selectedFunnelId)}
                className="bg-white/40"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Lista de estágios */}
      <div className="space-y-3">
        {funnelStages.map((stage, index) => (
          <StageConfigCard
            key={stage.id}
            stage={stage}
            stageNumber={index + 1}
            onConfigure={() => openStageModal(stage)}
            onNotificationToggle={(enabled) => handleQuickNotificationToggle(stage.id, enabled)}
          />
        ))}
      </div>

      {/* Modal de configuração */}
      <StageConfigModal
        isOpen={showStageModal}
        onClose={closeStageModal}
        stage={editingStage}
        onSave={handleStageUpdate}
      />

      {/* Info de ajuda */}
      <div className="mt-6 p-4 bg-blue-50/80 backdrop-blur-sm border border-blue-200/60 rounded-lg">
        <p className="text-sm text-blue-800 text-center">
          💡 <strong>Dica:</strong> Configure a descrição IA para cada estágio para que o agente possa analisar conversas e mover leads automaticamente
        </p>
      </div>
    </div>
  );
};