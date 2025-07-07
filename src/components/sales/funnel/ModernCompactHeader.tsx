
import { Funnel } from "@/types/funnel";
import { TrendingUp, Users, Target, Award, AlertCircle } from "lucide-react";

interface ModernCompactHeaderProps {
  selectedFunnel: Funnel | null;
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  activeTab: string;
}

export function ModernCompactHeader({ 
  selectedFunnel, 
  totalLeads, 
  wonLeads, 
  lostLeads,
  activeTab 
}: ModernCompactHeaderProps) {
  const activeLeads = totalLeads - wonLeads - lostLeads;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  // Título e descrição baseados na aba ativa
  const headerContent = activeTab === "won-lost" 
    ? {
        title: "Ganhos e Perdidos",
        description: "Resultados finais dos leads"
      }
    : {
        title: selectedFunnel?.name || "Carregando funil...",
        description: selectedFunnel?.description || "Aguarde..."
      };

  return (
    <div className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl p-3 shadow-2xl h-[60px] flex items-center justify-between">
      {/* Título e Descrição - Lado Esquerdo */}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent truncate">
          {headerContent.title}
        </h1>
        <p className="text-xs text-gray-600 truncate">
          {headerContent.description}
        </p>
      </div>

      {/* Métricas Inline - Apenas no funil principal */}
      {activeTab === "funnel" && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Métrica: Ativos */}
          <div className="bg-white/20 backdrop-blur-lg rounded-xl px-2 py-1 border border-white/30 flex items-center gap-1">
            <div className="p-1 bg-blue-500/20 rounded-md">
              <Users className="w-3 h-3 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-800">{activeLeads}</p>
              <p className="text-[10px] text-gray-600 leading-none">Ativos</p>
            </div>
          </div>

          {/* Métrica: Ganhos */}
          <div className="bg-white/20 backdrop-blur-lg rounded-xl px-2 py-1 border border-white/30 flex items-center gap-1">
            <div className="p-1 bg-green-500/20 rounded-md">
              <Award className="w-3 h-3 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-800">{wonLeads}</p>
              <p className="text-[10px] text-gray-600 leading-none">Ganhos</p>
            </div>
          </div>

          {/* Métrica: Perdidos */}
          <div className="bg-white/20 backdrop-blur-lg rounded-xl px-2 py-1 border border-white/30 flex items-center gap-1">
            <div className="p-1 bg-red-500/20 rounded-md">
              <AlertCircle className="w-3 h-3 text-red-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-800">{lostLeads}</p>
              <p className="text-[10px] text-gray-600 leading-none">Perdidos</p>
            </div>
          </div>

          {/* Métrica: Conversão */}
          <div className="bg-white/20 backdrop-blur-lg rounded-xl px-2 py-1 border border-white/30 flex items-center gap-1">
            <div className="p-1 bg-ticlin/20 rounded-md">
              <TrendingUp className="w-3 h-3 text-ticlin-dark" />
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-800">{conversionRate}%</p>
              <p className="text-[10px] text-gray-600 leading-none">Conv.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
