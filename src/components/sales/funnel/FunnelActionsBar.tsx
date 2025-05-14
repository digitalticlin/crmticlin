
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Tag, Plus, ChevronDown } from "lucide-react";
import { FunnelDropdown } from "./FunnelDropdown";

interface FunnelActionsBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onManageTags: () => void;
  onCreateNewFunnel: () => void;
  onSwitchFunnel: () => void;
  onAddColumn: () => void;
  onAddLead: () => void;
}

export function FunnelActionsBar({
  activeTab,
  setActiveTab,
  onManageTags,
  onCreateNewFunnel,
  onSwitchFunnel,
  onAddColumn,
  onAddLead,
}: FunnelActionsBarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 justify-between w-full">
      <div className="flex items-center gap-2">
        {/* Nome do Funil como Dropdown */}
        <FunnelDropdown
          label={
            <span className="font-semibold text-sm md:text-base">
              Funil Principal
            </span>
          }
          iconRight={<ChevronDown className="w-4 h-4" />}
          items={[
            {
              label: "Alternar Funil",
              onClick: onSwitchFunnel,
            },
            {
              label: "Novo Funil",
              onClick: onCreateNewFunnel,
              icon: <Plus className="w-4 h-4" />,
            },
          ]}
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
  );
}
