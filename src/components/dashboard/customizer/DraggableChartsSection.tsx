
import { DashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { DraggableItem } from "./DraggableItem";

const chartLabels: Record<keyof DashboardConfig['charts'], string> = {
  funil_conversao: "Funil de Conversão",
  performance_vendedores: "Performance dos Vendedores",
  evolucao_temporal: "Evolução Temporal",
  leads_etiquetas: "Leads por Etiquetas",
  distribuicao_fonte: "Distribuição por Fonte"
};

interface DraggableChartsSectionProps {
  config: DashboardConfig;
  onChartToggle: (chartKey: keyof DashboardConfig['charts']) => void;
}

export function DraggableChartsSection({ config, onChartToggle }: DraggableChartsSectionProps) {
  console.log("DraggableChartsSection render:");
  console.log("- config.charts:", config.charts);
  console.log("- chart_order:", config.layout.chart_order);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          📈 Gráficos
        </h3>
        <p className="text-white/70 text-sm">
          Selecione e reordene os gráficos do dashboard
        </p>
      </div>

      <Droppable droppableId="charts-list">
        {(provided, snapshot) => {
          console.log("Charts Droppable render - isDraggingOver:", snapshot.isDraggingOver);
          
          return (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {config.layout.chart_order.map((chartKey, index) => {
                const isEnabled = config.charts[chartKey as keyof typeof config.charts];
                console.log(`Chart ${chartKey} at index ${index} - isEnabled:`, isEnabled);
                
                return (
                  <Draggable key={chartKey} draggableId={`chart-${chartKey}`} index={index}>
                    {(provided, snapshot) => {
                      console.log(`Chart ${chartKey} Draggable - isDragging:`, snapshot.isDragging);
                      
                      return (
                        <DraggableItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          dragHandleProps={provided.dragHandleProps}
                          isDragging={snapshot.isDragging}
                          isEnabled={isEnabled}
                          label={chartLabels[chartKey as keyof typeof chartLabels]}
                          onToggle={() => {
                            console.log("Chart onToggle called for:", chartKey, "current state:", isEnabled);
                            onChartToggle(chartKey as keyof DashboardConfig['charts']);
                          }}
                        />
                      );
                    }}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          );
        }}
      </Droppable>
    </div>
  );
}
