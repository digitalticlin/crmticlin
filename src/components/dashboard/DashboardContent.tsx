
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";

export const DashboardContent = () => {
  const { config } = useDashboardConfig();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Período Atual</h3>
              <p className="text-muted-foreground">{config.period_filter}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">KPIs Ativos</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(config.kpis).map(([key, kpi]) => (
                  kpi.visible && (
                    <div key={key} className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{key}</p>
                      <p className="text-sm text-muted-foreground">Configurado</p>
                    </div>
                  )
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Gráficos Ativos</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(config.charts).map(([key, chart]) => (
                  chart.visible && (
                    <div key={key} className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{key}</p>
                      <p className="text-sm text-muted-foreground">Configurado</p>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
