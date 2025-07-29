import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";

export const DashboardCustomizer = () => {
  const { 
    config, 
    updateKPIVisibility,
    updateChartVisibility,
    updatePeriodFilter,
    resetToDefault,
    loading 
  } = useDashboardConfig();

  // Create handler functions to match expected names
  const handleKPIToggle = (kpiKey: string, visible: boolean) => {
    updateKPIVisibility(kpiKey, visible);
  };

  const handleChartToggle = (chartKey: string, visible: boolean) => {
    updateChartVisibility(chartKey, visible);
  };

  const updateConfig = (updates: any) => {
    // Handle general config updates
    if (updates.period_filter) {
      updatePeriodFilter(updates.period_filter);
    }
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="h-6 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Personalizar Dashboard</h3>
        
        {/* KPIs Section */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">KPIs Visíveis</h4>
          <div className="space-y-2">
            {Object.entries(config.kpis).map(([key, visible]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm">{key}</span>
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => handleKPIToggle(key, e.target.checked)}
                  className="rounded"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">Gráficos Visíveis</h4>
          <div className="space-y-2">
            {Object.entries(config.charts).map(([key, visible]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm">{key}</span>
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => handleChartToggle(key, e.target.checked)}
                  className="rounded"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={resetToDefault}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Restaurar Padrão
        </button>
      </div>
    </div>
  );
};
