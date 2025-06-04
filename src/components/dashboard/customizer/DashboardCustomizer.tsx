
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Settings } from "lucide-react";
import { useDashboardConfig, DashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { CustomizerSidebar } from "./CustomizerSidebar";
import { useCallback, memo } from "react";

// ETAPA 4: Memoizar o componente para otimizar performance
const DashboardCustomizer = memo(() => {
  const { 
    config, 
    loading, 
    updateConfig, 
    resetToDefault, 
    handleKPIToggle, 
    handleChartToggle,
    forceUpdate // ETAPA 3: Usando forceUpdate
  } = useDashboardConfig();
  
  const [open, setOpen] = useState(false);

  console.log("🎛️ DashboardCustomizer render - config:", config, "forceUpdate:", forceUpdate);

  // ETAPA 4: Memoizar o handleDragEnd para evitar re-renders
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) {
      console.log("❌ Drag cancelled - no destination");
      return;
    }

    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      console.log("❌ Drag cancelled - same position");
      return;
    }

    console.log("=== DRAG END ===", { source, destination });

    try {
      if (source.droppableId === 'kpis-list') {
        const newKpiOrder = [...config.layout.kpi_order];
        const [removed] = newKpiOrder.splice(source.index, 1);
        newKpiOrder.splice(destination.index, 0, removed);

        console.log("📊 New KPI order:", newKpiOrder);

        updateConfig({
          layout: {
            ...config.layout,
            kpi_order: newKpiOrder
          }
        });
        
      } else if (source.droppableId === 'charts-list') {
        const newChartOrder = [...config.layout.chart_order];
        const [removed] = newChartOrder.splice(source.index, 1);
        newChartOrder.splice(destination.index, 0, removed);

        console.log("📈 New Chart order:", newChartOrder);

        updateConfig({
          layout: {
            ...config.layout,
            chart_order: newChartOrder
          }
        });
      }
    } catch (error) {
      console.error("❌ Drag error:", error);
    }
  }, [config.layout, updateConfig]);

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
            onReset={resetToDefault}
          />
        </DragDropContext>
      </SheetContent>
    </Sheet>
  );
});

DashboardCustomizer.displayName = "DashboardCustomizer";

export default DashboardCustomizer;
