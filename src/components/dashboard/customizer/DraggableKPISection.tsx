
import { DashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { DraggableItem } from "./DraggableItem";

const kpiLabels: Record<keyof DashboardConfig['kpis'], string> = {
  novos_leads: "Novos Leads",
  total_leads: "Total de Leads",
  taxa_conversao: "Taxa de Conversão",
  taxa_perda: "Taxa de Perda",
  valor_pipeline: "Valor do Pipeline",
  ticket_medio: "Ticket Médio",
  tempo_resposta: "Tempo de Resposta"
};

interface DraggableKPISectionProps {
  config: DashboardConfig;
  onKPIToggle: (kpiKey: keyof DashboardConfig['kpis']) => void;
}

export function DraggableKPISection({ config, onKPIToggle }: DraggableKPISectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          📊 Indicadores (KPIs)
        </h3>
        <p className="text-white/70 text-sm">
          Selecione e reordene os indicadores do dashboard
        </p>
      </div>

      <Droppable droppableId="kpis-list">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-3"
          >
            {config.layout.kpi_order.map((kpiKey, index) => (
              <Draggable key={kpiKey} draggableId={kpiKey} index={index}>
                {(provided, snapshot) => (
                  <DraggableItem
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    dragHandleProps={provided.dragHandleProps}
                    isDragging={snapshot.isDragging}
                    isEnabled={config.kpis[kpiKey as keyof typeof config.kpis]}
                    label={kpiLabels[kpiKey as keyof typeof kpiLabels]}
                    onToggle={() => onKPIToggle(kpiKey as keyof DashboardConfig['kpis'])}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
