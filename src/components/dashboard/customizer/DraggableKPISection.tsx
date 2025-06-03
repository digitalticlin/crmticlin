
import { DashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { Droppable } from "react-beautiful-dnd";
import { DraggableItem } from "./DraggableItem";

const kpiLabels = {
  novos_leads: "Novos Leads",
  total_leads: "Total de Leads",
  taxa_conversao: "Taxa de Conversão",
  taxa_perda: "Taxa de Perda",
  valor_pipeline: "Valor do Pipeline",
  ticket_medio: "Ticket Médio",
  tempo_resposta: "Tempo de Resposta"
};

interface DraggableKPISectionProps {
  tempConfig: DashboardConfig;
  onKPIToggle: (kpiKey: keyof DashboardConfig['kpis']) => void;
}

export function DraggableKPISection({ tempConfig, onKPIToggle }: DraggableKPISectionProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-3xl blur-sm"></div>
      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-[#D3D800] to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-gray-900 font-bold text-lg">📊</span>
          </div>
          <h3 className="text-xl font-bold text-white">Principais</h3>
        </div>
        
        <Droppable droppableId="kpis-list">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-4 ${snapshot.isDraggingOver ? 'bg-white/5 rounded-2xl p-2' : ''}`}
            >
              {tempConfig.layout.kpi_order.map((key, index) => (
                <DraggableItem
                  key={key}
                  id={key}
                  index={index}
                  label={kpiLabels[key as keyof typeof kpiLabels]}
                  isVisible={tempConfig.kpis[key as keyof DashboardConfig['kpis']]}
                  onToggle={() => onKPIToggle(key as keyof DashboardConfig['kpis'])}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}
