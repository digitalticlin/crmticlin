
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Tag, UserPlus } from "lucide-react";
import { TagManagementModal } from "../modals/TagManagementModal";
import { CreateLeadModal } from "../modals/CreateLeadModal";
import { FunnelConfigModal } from "../modals/FunnelConfigModal";

interface FunnelActionButtonsProps {
  isAdmin: boolean;
}

export const FunnelActionButtons = ({ isAdmin }: FunnelActionButtonsProps) => {
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isFunnelConfigOpen, setIsFunnelConfigOpen] = useState(false);

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
      />

      <CreateLeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
      />

      <FunnelConfigModal
        isOpen={isFunnelConfigOpen}
        onClose={() => setIsFunnelConfigOpen(false)}
      />
    </>
  );
};
