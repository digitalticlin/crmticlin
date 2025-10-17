
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import LazyKPIGrid from "@/components/dashboard/lazy/LazyKPIGrid";
import LazyChartsSection from "@/components/dashboard/lazy/LazyChartsSection";
import { DashboardConfigProvider } from "@/hooks/dashboard/useDashboardConfig";
import { useDashboardFilters } from "@/hooks/shared/filters";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const dataFilters = useDashboardFilters();

  console.log('[Dashboard] 🔍 Sistema de controle de acesso:', {
    role: permissions.role,
    canViewReports: permissions.canViewReports,
    dataFilters: dataFilters.role,
    loading: permissionsLoading || dataFilters.loading
  });

  // Loading state para permissões
  if (permissionsLoading || dataFilters.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  // Verificar se tem permissão para acessar o dashboard
  if (!permissions.allowedPages.includes('dashboard')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
          <p className="text-gray-600">Você não tem permissão para acessar o dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardConfigProvider>
      <DashboardHeader />

      {/* Grid de KPIs com espaçamento otimizado */}
      <div className="mb-6">
        <LazyKPIGrid />
      </div>

      {/* Seção de gráficos */}
      <div>
        <LazyChartsSection />
      </div>
    </DashboardConfigProvider>
  );
}
