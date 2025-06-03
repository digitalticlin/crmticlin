
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
  console.log("DraggableChartsSection - config.charts:", config.charts);
  console.log("DraggableChartsSection - chart_order:", config.layout.chart_order);

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
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-3"
          >
            {config.layout.chart_order.map((chartKey, index) => {
              const isEnabled = config.charts[chartKey as keyof typeof config.charts];
              console.log(`Chart ${chartKey} - isEnabled:`, isEnabled);
              
              return (
                <Draggable key={chartKey} draggableId={chartKey} index={index}>
                  {(provided, snapshot) => (
                    <DraggableItem
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      dragHandleProps={provided.dragHandleProps}
                      isDragging={snapshot.isDragging}
                      isEnabled={isEnabled}
                      label={chartLabels[chartKey as keyof typeof chartLabels]}
                      onToggle={() => {
                        console.log("onChartToggle called for:", chartKey);
                        onChartToggle(chartKey as keyof DashboardConfig['charts']);
                      }}
                    />
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
