
import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { ChartsSection } from "@/components/dashboard/ChartsSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const isMobile = useIsMobile();

  // Mock data - em produção, estes dados viriam de APIs/hooks
  const kpiData = {
    totalLeads: 1247,
    newLeads: 89,
    conversions: 156,
    responseRate: 87
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <ResponsiveSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className={cn(
          "p-4 md:p-6 space-y-6 md:space-y-8",
          isMobile && "pt-6"
        )}>
          <DashboardHeader />
          <KPIGrid {...kpiData} />
          <ChartsSection />
        </div>
      </main>
    </div>
  );
}
