
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Settings } from "lucide-react";
import { useDashboardConfig, DashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { CustomizerSidebar } from "./CustomizerSidebar";

export default function DashboardCustomizer() {
  const { config, loading, updateConfig, resetToDefault } = useDashboardConfig();
  const [open, setOpen] = useState(false);

  console.log("DashboardCustomizer render - current config:", config);

  const handleKPIToggle = async (kpiKey: keyof DashboardConfig['kpis']) => {
    console.log("=== KPI TOGGLE START ===");
    console.log("Toggling KPI:", kpiKey);
    console.log("Current KPI state:", config.kpis[kpiKey]);
    console.log("New KPI state will be:", !config.kpis[kpiKey]);
    
    const updatedConfig = {
      ...config,
      kpis: {
        ...config.kpis,
        [kpiKey]: !config.kpis[kpiKey]
      }
    };
    
    console.log("Updated config:", updatedConfig);
    await updateConfig(updatedConfig);
    console.log("=== KPI TOGGLE END ===");
  };

  const handleChartToggle = async (chartKey: keyof DashboardConfig['charts']) => {
    console.log("=== CHART TOGGLE START ===");
    console.log("Toggling Chart:", chartKey);
    console.log("Current Chart state:", config.charts[chartKey]);
    console.log("New Chart state will be:", !config.charts[chartKey]);
    
    const updatedConfig = {
      ...config,
      charts: {
        ...config.charts,
        [chartKey]: !config.charts[chartKey]
      }
    };
    
    console.log("Updated config:", updatedConfig);
    await updateConfig(updatedConfig);
    console.log("=== CHART TOGGLE END ===");
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    console.log("=== DRAG END START ===");
    console.log("Drag result:", result);

    let updatedConfig = { ...config };

    if (source.droppableId === 'kpis-list') {
      const newKpiOrder = Array.from(config.layout.kpi_order);
      const [removed] = newKpiOrder.splice(source.index, 1);
      newKpiOrder.splice(destination.index, 0, removed);

      updatedConfig = {
        ...updatedConfig,
        layout: {
          ...updatedConfig.layout,
          kpi_order: newKpiOrder
        }
      };
      
      console.log("New KPI order:", newKpiOrder);
    } else if (source.droppableId === 'charts-list') {
      const newChartOrder = Array.from(config.layout.chart_order);
      const [removed] = newChartOrder.splice(source.index, 1);
      newChartOrder.splice(destination.index, 0, removed);

      updatedConfig = {
        ...updatedConfig,
        layout: {
          ...updatedConfig.layout,
          chart_order: newChartOrder
        }
      };
      
      console.log("New Chart order:", newChartOrder);
    }

    console.log("Updated config after drag:", updatedConfig);
    await updateConfig(updatedConfig);
    console.log("=== DRAG END END ===");
  };

  const handleReset = async () => {
    console.log("=== RESET START ===");
    await resetToDefault();
    console.log("=== RESET END ===");
  };

  if (loading) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="bg-white/10 border border-[#D3D800]/30 text-[#D3D800] hover:bg-[#D3D800]/20 hover:border-[#D3D800]/50 backdrop-blur-lg rounded-2xl font-medium transition-all duration-300 hover:scale-105 px-4 py-2"
        >
          <Settings className="w-4 h-4 mr-2" />
          PERSONALIZAR
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className="w-[520px] overflow-hidden border-0 p-0"
        style={{
          background: `radial-gradient(circle at 30% 70%, #D3D800 0%, transparent 50%), 
                       radial-gradient(circle at 80% 20%, #17191c 0%, transparent 60%),
                       radial-gradient(circle at 60% 40%, #D3D800 0%, transparent 40%),
                       linear-gradient(135deg, rgba(211, 216, 0, 0.1) 0%, rgba(23, 25, 28, 0.95) 100%)`
        }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <CustomizerSidebar
            config={config}
            onKPIToggle={handleKPIToggle}
            onChartToggle={handleChartToggle}
            onReset={handleReset}
          />
        </DragDropContext>
      </SheetContent>
    </Sheet>
  );
}
