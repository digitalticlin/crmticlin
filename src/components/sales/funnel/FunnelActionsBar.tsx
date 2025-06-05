
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Tag, Plus } from "lucide-react";
import { FunnelDropdown } from "./FunnelDropdown";
import { FunnelSelectorDropdown } from "./FunnelSelectorDropdown";
import { CreateFunnelModal } from "./CreateFunnelModal";
import { Funnel } from "@/types/funnel";

interface FunnelActionsBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onManageTags: () => void;
  onAddColumn: () => void;
  onAddLead: () => void;
  // Novos props para múltiplos funis
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  onSelectFunnel: (funnel: Funnel) => void;
  onCreateFunnel: (name: string, description?: string) => Promise<void>;
  isAdmin?: boolean;
}

export function FunnelActionsBar({
  activeTab,
  setActiveTab,
  onManageTags,
  onAddColumn,
  onAddLead,
  funnels,
  selectedFunnel,
  onSelectFunnel,
  onCreateFunnel,
  isAdmin = false,
}: FunnelActionsBarProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateNewFunnel = () => {
    if (isAdmin) {
      setShowCreateModal(true);
    }
  };

  const handleCreateFunnel = async (name: string, description?: string) => {
    await onCreateFunnel(name, description);
    setShowCreateModal(false);
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 justify-between w-full">
        <div className="flex items-center gap-2">
          {/* Seletor de Funil */}
          <FunnelSelectorDropdown
            funnels={funnels}
            selectedFunnel={selectedFunnel}
            onSelectFunnel={onSelectFunnel}
            onCreateNewFunnel={handleCreateNewFunnel}
            isAdmin={isAdmin}
          />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="shadow bg-white/90 dark:bg-[#232323] border border-slate-200/70 dark:border-white/10 flex px-2 gap-2 rounded-full py-1">
              <TabsTrigger
                value="funnel"
                className={`px-4 py-1 rounded-full font-medium text-xs md:text-sm transition-all
                  ${activeTab === "funnel"
                    ? "bg-ticlin text-black shadow"
                    : "text-neutral-700 dark:text-white hover:bg-ticlin/10"}
                `}
              >
                Funil Principal
              </TabsTrigger>
              <TabsTrigger
                value="won-lost"
                className={`px-4 py-1 rounded-full font-medium text-xs md:text-sm transition-all
                  ${activeTab === "won-lost"
                    ? "bg-ticlin text-black shadow"
                    : "text-neutral-700 dark:text-white hover:bg-ticlin/10"}
                `}
              >
                Ganhos e Perdidos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão: Gerenciar Etiquetas */}
          <Button
            variant="outline"
            className="gap-1 items-center"
            onClick={onManageTags}
          >
            <Tag className="w-4 h-4" />
            <span className="hidden md:inline">Gerenciar Etiquetas</span>
          </Button>

          {/* Botão + com opções de Adicionar Lead/Etapa */}
          <FunnelDropdown
            label={<Plus className="w-5 h-5" />}
            items={[
              {
                label: "Adicionar Lead",
                onClick: onAddLead,
              },
              {
                label: "Adicionar Etapa",
                onClick: onAddColumn,
              },
            ]}
            variant="default"
          />
        </div>
      </div>

      {/* Modal de Criação de Funil */}
      <CreateFunnelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateFunnel={handleCreateFunnel}
      />
    </>
  );
}
