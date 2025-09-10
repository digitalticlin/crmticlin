
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import LazyCustomizer from "@/components/dashboard/lazy/LazyCustomizer";
import LazyKPIGrid from "@/components/dashboard/lazy/LazyKPIGrid";
import LazyChartsSection from "@/components/dashboard/lazy/LazyChartsSection";
import PeriodFilter from "@/components/dashboard/PeriodFilter";
import { DashboardConfigProvider } from "@/hooks/dashboard/useDashboardConfig";
import { useDataFilters } from "@/hooks/useDataFilters";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const dataFilters = useDataFilters();

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
      
      <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 lg:p-8 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Análise de Performance</h2>
            <p className="text-sm text-gray-800">
              {permissions.role === 'admin' 
                ? 'Visualize todos os dados e métricas da sua organização' 
                : 'Visualize os dados dos recursos atribuídos a você'
              }
            </p>
            {/* Badge indicativo do tipo de acesso */}
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                permissions.role === 'admin' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {permissions.role === 'admin' ? '👑 Admin - Visão Completa' : '🎯 Operacional - Recursos Atribuídos'}
              </span>
            </div>
          </div>
          
          <div className="flex justify-center lg:justify-start">
            <PeriodFilter />
          </div>
          
          <div className="flex justify-center lg:justify-end">
            <LazyCustomizer />
          </div>
        </div>
      </div>
      
      <div>
        <LazyKPIGrid />
      </div>
      
      <div>
        <LazyChartsSection />
      </div>
    </DashboardConfigProvider>
  );
}
