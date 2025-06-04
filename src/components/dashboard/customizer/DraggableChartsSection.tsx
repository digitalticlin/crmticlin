
import { DashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Switch } from "@/components/ui/switch";
import { GripVertical, BarChart3, Users, TrendingUp, Tag, PieChart } from "lucide-react";

const chartIcons = {
  funil_conversao: BarChart3,
  performance_vendedores: Users,
  evolucao_temporal: TrendingUp,
  leads_etiquetas: Tag,
  distribuicao_fonte: PieChart
};

const chartLabels = {
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
  console.log("📈 DraggableChartsSection RENDER - config.charts:", config.charts);

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Gráficos
      </h3>
      
      <Droppable droppableId="charts-list">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-3"
          >
            {config.layout.chart_order.map((chartKey, index) => {
              const IconComponent = chartIcons[chartKey as keyof typeof chartIcons];
              const isEnabled = config.charts[chartKey as keyof typeof config.charts];
              
              console.log(`📊 Rendering Chart Toggle ${chartKey}: enabled=${isEnabled}`);
              
              return (
                <Draggable 
                  key={chartKey} 
                  draggableId={chartKey} 
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`
                        flex items-center justify-between p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 transform
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
                          {chartLabels[chartKey as keyof typeof chartLabels]}
                        </span>
                      </div>
                      
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => {
                          console.log(`🔄 SWITCH TOGGLE ${chartKey}: ${isEnabled} -> ${!isEnabled}`);
                          onChartToggle(chartKey as keyof DashboardConfig['charts']);
                        }}
                        className="data-[state=checked]:bg-[#D3D800] data-[state=unchecked]:bg-white/20 transition-all duration-200 transform hover:scale-110"
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
