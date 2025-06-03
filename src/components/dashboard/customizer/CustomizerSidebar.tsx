
import { DashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { Separator } from "@/components/ui/separator";
import { CustomizerHeader } from "./CustomizerHeader";
import { DraggableKPISection } from "./DraggableKPISection";
import { DraggableChartsSection } from "./DraggableChartsSection";
import { CustomizerActions } from "./CustomizerActions";

interface CustomizerSidebarProps {
  tempConfig: DashboardConfig;
  onKPIToggle: (kpiKey: keyof DashboardConfig['kpis']) => void;
  onChartToggle: (chartKey: keyof DashboardConfig['charts']) => void;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
  saving?: boolean;
}

export function CustomizerSidebar({
  tempConfig,
  onKPIToggle,
  onChartToggle,
  onSave,
  onReset,
  onClose,
  saving = false
}: CustomizerSidebarProps) {
  return (
    <>
      {/* Elementos flutuantes para profundidade */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-10 w-32 h-32 bg-[#D3D800]/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-white/10 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-[#D3D800]/15 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 h-full flex flex-col">
        <CustomizerHeader onReset={onReset} />

        <div className="flex-1 px-8 pb-8 space-y-8 overflow-y-auto">
          <DraggableKPISection
            tempConfig={tempConfig}
            onKPIToggle={onKPIToggle}
          />

          <Separator className="bg-gradient-to-r from-transparent via-[#D3D800]/50 to-transparent h-[2px]" />

          <DraggableChartsSection
            tempConfig={tempConfig}
            onChartToggle={onChartToggle}
          />

          <CustomizerActions
            onSave={onSave}
            onClose={onClose}
            saving={saving}
          />
        </div>
      </div>
    </>
  );
}
