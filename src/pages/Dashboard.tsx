
import Sidebar from "@/components/layout/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import KPIGrid from "@/components/dashboard/KPIGrid";
import ChartsSection from "@/components/dashboard/ChartsSection";
import StatsSection from "@/components/dashboard/StatsSection";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <DashboardHeader />
            <KPIGrid />
            <ChartsSection />
            <StatsSection />
          </div>
        </main>
      </div>
    </div>
  );
}
