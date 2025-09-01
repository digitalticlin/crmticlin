
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Tag, UserPlus } from "lucide-react";
import { TagManagementModal } from "../modals/TagManagementModal";
import { FunnelConfigModal } from "../modals/FunnelConfigModal";
import { RealClientDetails } from "@/components/clients/RealClientDetails";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useCreateClientMutation } from "@/hooks/clients/mutations";
import { ClientData } from "@/hooks/clients/types";
import { useSalesFunnelDirect } from "@/hooks/salesFunnel/useSalesFunnelDirect";

interface FunnelActionButtonsProps {
  isAdmin: boolean;
}

export const FunnelActionButtons = ({ isAdmin }: FunnelActionButtonsProps) => {
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isFunnelConfigOpen, setIsFunnelConfigOpen] = useState(false);
  
  const { companyId } = useCompanyData();
  const { selectedFunnel, stages, refetchLeads } = useSalesFunnelDirect();
  const createClientMutation = useCreateClientMutation(companyId);

  const handleCreateLead = async (data: Partial<ClientData>) => {
    if (!selectedFunnel) return;

    // Encontrar a primeira etapa do funil (entrada)
    const entryStage = stages.find(s => s.order_position === 0) || stages[0];
    
    try {
      await createClientMutation.mutateAsync({
        ...data,
        funnel_id: selectedFunnel.id,
        kanban_stage_id: entryStage?.id,
      } as any);
      
      setIsLeadModalOpen(false);
      refetchLeads();
    } catch (error) {
      console.error("Erro ao criar lead:", error);
    }
  };

  const handleTagsChange = async () => {
    // Refresh tags or perform any necessary action after tag changes
    refetchLeads();
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Botão de Etiquetas */}
        <Button
          onClick={() => setIsTagModalOpen(true)}
          variant="outline"
          size="sm"
          className="bg-white/30 backdrop-blur-sm border-white/40 hover:bg-white/50 text-gray-800 hover:text-gray-900 font-medium shadow-sm"
        >
          <Tag className="w-4 h-4 mr-2" />
          Etiquetas
        </Button>

        {/* Botão de Adicionar Lead */}
        <Button
          onClick={() => setIsLeadModalOpen(true)}
          variant="outline"
          size="sm"
          className="bg-white/30 backdrop-blur-sm border-white/40 hover:bg-white/50 text-gray-800 hover:text-gray-900 font-medium shadow-sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Lead
        </Button>

        {/* Botão de Configurações do Funil */}
        {isAdmin && (
          <Button
            onClick={() => setIsFunnelConfigOpen(true)}
            variant="outline"
            size="sm"
            className="bg-white/30 backdrop-blur-sm border-white/40 hover:bg-white/50 text-gray-800 hover:text-gray-900 shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Modais */}
      <TagManagementModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onTagsChange={handleTagsChange}
      />

      <RealClientDetails
        client={null}
        isOpen={isLeadModalOpen}
        isCreateMode={true}
        onOpenChange={setIsLeadModalOpen}
        onCreateClient={handleCreateLead}
      />

      <FunnelConfigModal
        isOpen={isFunnelConfigOpen}
        onClose={() => setIsFunnelConfigOpen(false)}
      />
    </>
  );
};
