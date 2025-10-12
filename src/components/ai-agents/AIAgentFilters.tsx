
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AIAgentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedStatus: "all" | "active" | "inactive";
  onStatusChange: (status: "all" | "active" | "inactive") => void;
  selectedType: "all" | "attendance" | "sales" | "support" | "custom";
  onTypeChange: (type: "all" | "attendance" | "sales" | "support" | "custom") => void;
  totalAgents: number;
  activeAgents: number;
}

export const AIAgentFilters = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedType,
  onTypeChange,
  totalAgents,
  activeAgents
}: AIAgentFiltersProps) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Contadores */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-700">
            <strong>{activeAgents}</strong> ativos
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gray-400"></div>
          <span className="text-sm text-gray-700">
            <strong>{totalAgents - activeAgents}</strong> inativos
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Total: <strong>{totalAgents}</strong> agentes
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar agente por nome..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white/50 backdrop-blur-sm border-white/40"
        />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Status:</span>
        </div>

        <Button
          variant={selectedStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange("all")}
          className={selectedStatus === "all" ? "bg-ticlin hover:bg-ticlin/90 text-black" : "bg-white/50"}
        >
          Todos
        </Button>
        <Button
          variant={selectedStatus === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange("active")}
          className={selectedStatus === "active" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-white/50"}
        >
          Ativos
        </Button>
        <Button
          variant={selectedStatus === "inactive" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange("inactive")}
          className={selectedStatus === "inactive" ? "bg-gray-500 hover:bg-gray-600 text-white" : "bg-white/50"}
        >
          Inativos
        </Button>

        <div className="h-4 w-px bg-gray-300 mx-2"></div>

        <span className="text-sm font-medium text-gray-700">Tipo:</span>

        <Button
          variant={selectedType === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onTypeChange("all")}
          className={selectedType === "all" ? "bg-ticlin hover:bg-ticlin/90 text-black" : "bg-white/50"}
        >
          Todos
        </Button>
        <Button
          variant={selectedType === "attendance" ? "default" : "outline"}
          size="sm"
          onClick={() => onTypeChange("attendance")}
          className={selectedType === "attendance" ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-white/50"}
        >
          Atendimento
        </Button>
        <Button
          variant={selectedType === "sales" ? "default" : "outline"}
          size="sm"
          onClick={() => onTypeChange("sales")}
          className={selectedType === "sales" ? "bg-ticlin hover:bg-ticlin/90 text-black" : "bg-white/50"}
        >
          Vendas
        </Button>
        <Button
          variant={selectedType === "support" ? "default" : "outline"}
          size="sm"
          onClick={() => onTypeChange("support")}
          className={selectedType === "support" ? "bg-purple-500 hover:bg-purple-600 text-white" : "bg-white/50"}
        >
          Suporte
        </Button>
        <Button
          variant={selectedType === "custom" ? "default" : "outline"}
          size="sm"
          onClick={() => onTypeChange("custom")}
          className={selectedType === "custom" ? "bg-gray-600 hover:bg-gray-700 text-white" : "bg-white/50"}
        >
          Custom
        </Button>
      </div>
    </div>
  );
};
