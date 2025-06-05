
import { Funnel } from "@/types/funnel";
import { TrendingUp, Users, Target, Award, AlertCircle } from "lucide-react";

interface ModernFunnelHeaderProps {
  selectedFunnel: Funnel;
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  activeTab: string;
}

export function ModernFunnelHeader({ 
  selectedFunnel, 
  totalLeads, 
  wonLeads, 
  lostLeads,
  activeTab 
}: ModernFunnelHeaderProps) {
  const activeLeads = totalLeads - wonLeads - lostLeads;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  // Título e descrição baseados na aba ativa
  const headerContent = activeTab === "won-lost" 
    ? {
        title: "Ganhos e Perdidos",
        description: "Visualize os resultados finais dos seus leads"
      }
    : {
        title: selectedFunnel.name,
        description: selectedFunnel.description || "Gerencie seus leads e oportunidades de vendas"
      };

  return (
    <div className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-3xl p-4 shadow-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Título e Descrição */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            {headerContent.title}
          </h1>
          <p className="text-base text-gray-600 max-w-2xl">
            {headerContent.description}
          </p>
        </div>

        {/* Métricas em Cards - apenas no funil principal */}
        {activeTab === "funnel" && (
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-3 min-w-[110px] border border-white/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/20 rounded-xl">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-800">{activeLeads}</p>
                  <p className="text-xs text-gray-600">Ativos</p>
                </div>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-3 min-w-[110px] border border-white/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-500/20 rounded-xl">
                  <Award className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-800">{wonLeads}</p>
                  <p className="text-xs text-gray-600">Ganhos</p>
                </div>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-3 min-w-[110px] border border-white/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-800">{lostLeads}</p>
                  <p className="text-xs text-gray-600">Perdidos</p>
                </div>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-3 min-w-[110px] border border-white/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-ticlin/20 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-ticlin-dark" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-800">{conversionRate}%</p>
                  <p className="text-xs text-gray-600">Conversão</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
