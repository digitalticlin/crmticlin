
import { DashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Switch } from "@/components/ui/switch";
import { GripVertical, TrendingUp, Users, UserPlus } from "lucide-react";

const kpiIcons = {
  novos_leads: UserPlus,
  total_leads: Users,
  taxa_conversao: TrendingUp,
  taxa_perda: TrendingUp,
  valor_pipeline: TrendingUp,
  ticket_medio: TrendingUp,
} as const;

const kpiLabels = {
  novos_leads: "Novos Leads",
  total_leads: "Total de Leads", 
  taxa_conversao: "Taxa de Conversão",
  taxa_perda: "Taxa de Perda",
  valor_pipeline: "Valor do Pipeline",
  ticket_medio: "Ticket Médio",
} as const;

const allowedKpis = Object.keys(kpiLabels);

interface DraggableKPISectionProps {
  config: DashboardConfig;
  onKPIToggle: (kpiKey: keyof DashboardConfig['kpis']) => void;
}

export function DraggableKPISection({ config, onKPIToggle }: DraggableKPISectionProps) {
  const timestamp = Date.now();
  console.log(`🎯 DraggableKPISection RENDER [${timestamp}] - config.kpis:`, config.kpis);

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Indicadores (KPIs)
      </h3>
      
      <Droppable droppableId="kpis-list">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-3"
          >
            {config.layout.kpi_order.filter(k => allowedKpis.includes(k)).map((kpiKey, index) => {
              const IconComponent = kpiIcons[kpiKey as keyof typeof kpiIcons];
              const isEnabled = config.kpis[kpiKey as keyof typeof config.kpis];
              
              console.log(`📊 Rendering KPI Toggle [${timestamp}] ${kpiKey}: enabled=${isEnabled}`);
              
              return (
                <Draggable 
                  key={kpiKey} 
                  draggableId={kpiKey} 
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`
                        flex items-center justify-between p-4 rounded-xl border backdrop-blur-sm transition-all duration-100 transform
                        ${snapshot.isDragging 
                          ? 'bg-white/25 border-[#D3D800]/60 shadow-xl scale-105' 
                          : 'bg-white/15 border-white/20 hover:bg-white/20 hover:scale-102'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div {...provided.dragHandleProps}>
                          <GripVertical className="w-4 h-4 text-white/60 hover:text-white transition-colors cursor-grab" />
                        </div>
                        
                        {IconComponent && (
                          <IconComponent className="w-4 h-4 text-[#D3D800]" />
                        )}
                        
                        <span className="text-white font-medium">
                          {kpiLabels[kpiKey as keyof typeof kpiLabels]}
                        </span>
                      </div>
                      
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => {
                          const switchTimestamp = Date.now();
                          console.log(`🔄 SWITCH INSTANT TOGGLE [${switchTimestamp}] ${kpiKey}: ${isEnabled} -> ${!isEnabled}`);
                          onKPIToggle(kpiKey as keyof DashboardConfig['kpis']);
                        }}
                        className="data-[state=checked]:bg-[#D3D800] data-[state=unchecked]:bg-white/20 transition-all duration-100 transform hover:scale-110"
                      />
                    </div>
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
