
import { ChevronDown } from "lucide-react";
import { Funnel } from "@/types/funnel";

interface FunnelTabButtonProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  onSelectFunnel: (funnel: Funnel) => void;
  onCreateFunnel: (name: string, description?: string) => Promise<void>;
  isAdmin: boolean;
}

export const FunnelTabButton = ({
  activeTab,
  setActiveTab,
  selectedFunnel
}: FunnelTabButtonProps) => {
  const handleFunnelButtonClick = () => {
    // Sempre vai para a aba funnel, sem abrir dropdown
    setActiveTab("funnel");
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
        activeTab === "funnel"
          ? "bg-white/80 text-gray-900 shadow-md backdrop-blur-sm"
          : "text-gray-800 hover:text-gray-900 hover:bg-white/30"
      }`}
      onClick={handleFunnelButtonClick}
    >
      <span className="truncate">
        {selectedFunnel?.name || "Funil de Vendas"}
      </span>
    </button>
  );
};
