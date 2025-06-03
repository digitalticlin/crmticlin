
import { DashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { Droppable } from "react-beautiful-dnd";
import { DraggableItem } from "./DraggableItem";

const chartLabels = {
  funil_conversao: "Funil de Conversão",
  performance_vendedores: "Performance de Vendedores",
  evolucao_temporal: "Evolução Temporal",
  leads_etiquetas: "Leads por Etiquetas"
};

interface DraggableChartsSectionProps {
  tempConfig: DashboardConfig;
  onChartToggle: (chartKey: keyof DashboardConfig['charts']) => void;
}

export function DraggableChartsSection({ tempConfig, onChartToggle }: DraggableChartsSectionProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-3xl blur-sm"></div>
      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-[#D3D800] to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-gray-900 font-bold text-lg">📈</span>
          </div>
          <h3 className="text-xl font-bold text-white">Gráficos</h3>
        </div>
        
        <Droppable droppableId="charts-list">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-4 ${snapshot.isDraggingOver ? 'bg-white/5 rounded-2xl p-2' : ''}`}
            >
              {tempConfig.layout.chart_order.map((key, index) => (
                <DraggableItem
                  key={key}
                  id={key}
                  index={index}
                  label={chartLabels[key as keyof typeof chartLabels]}
                  isVisible={tempConfig.charts[key as keyof DashboardConfig['charts']]}
                  onToggle={() => onChartToggle(key as keyof DashboardConfig['charts'])}
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
