
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
  const [tempConfig, setTempConfig] = useState<DashboardConfig>(config);

  const handleKPIToggle = (kpiKey: keyof DashboardConfig['kpis']) => {
    setTempConfig(prev => ({
      ...prev,
      kpis: {
        ...prev.kpis,
        [kpiKey]: !prev.kpis[kpiKey]
      }
    }));
  };

  const handleChartToggle = (chartKey: keyof DashboardConfig['charts']) => {
    setTempConfig(prev => ({
      ...prev,
      charts: {
        ...prev.charts,
        [chartKey]: !prev.charts[chartKey]
      }
    }));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    if (source.droppableId === 'kpis-list') {
      const newKpiOrder = Array.from(tempConfig.layout.kpi_order);
      const [removed] = newKpiOrder.splice(source.index, 1);
      newKpiOrder.splice(destination.index, 0, removed);

      setTempConfig(prev => ({
        ...prev,
        layout: {
          ...prev.layout,
          kpi_order: newKpiOrder
        }
      }));
    } else if (source.droppableId === 'charts-list') {
      const newChartOrder = Array.from(tempConfig.layout.chart_order);
      const [removed] = newChartOrder.splice(source.index, 1);
      newChartOrder.splice(destination.index, 0, removed);

      setTempConfig(prev => ({
        ...prev,
        layout: {
          ...prev.layout,
          chart_order: newChartOrder
        }
      }));
    }
  };

  const handleSave = async () => {
    await updateConfig(tempConfig);
    setOpen(false);
  };

  const handleReset = async () => {
    await resetToDefault();
    setTempConfig(config);
  };

  if (loading) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="bg-white/10 border border-[#D3D800]/30 text-[#D3D800] hover:bg-[#D3D800]/20 hover:border-[#D3D800]/50 backdrop-blur-lg rounded-2xl font-medium transition-all duration-300 hover:scale-105 px-4 py-2"
          onClick={() => setTempConfig(config)}
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
            tempConfig={tempConfig}
            onKPIToggle={handleKPIToggle}
            onChartToggle={handleChartToggle}
            onSave={handleSave}
            onReset={handleReset}
            onClose={() => setOpen(false)}
          />
        </DragDropContext>
      </SheetContent>
    </Sheet>
  );
}
