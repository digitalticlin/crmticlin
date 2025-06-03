
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Settings, RotateCcw, Eye, EyeOff } from "lucide-react";
import { useDashboardConfig, DashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { Separator } from "@/components/ui/separator";

const kpiLabels = {
  novos_leads: "Novos Leads",
  total_leads: "Total de Leads",
  taxa_conversao: "Taxa de Conversão",
  taxa_perda: "Taxa de Perda",
  valor_pipeline: "Valor do Pipeline",
  ticket_medio: "Ticket Médio",
  tempo_resposta: "Tempo de Resposta"
};

const chartLabels = {
  funil_conversao: "Funil de Conversão",
  performance_vendedores: "Performance de Vendedores",
  evolucao_temporal: "Evolução Temporal",
  leads_etiquetas: "Leads por Etiquetas"
};

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
          variant="default"
          className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 text-white border border-gray-600 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
          onClick={() => setTempConfig(config)}
        >
          <Settings className="w-4 h-4 mr-2" />
          PERSONALIZAR
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className="w-96 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-l border-gray-600/50 shadow-2xl text-white overflow-y-auto"
      >
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Personalizar Dashboard
            </SheetTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Padrão
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* KPIs Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-white">KPIs Principais</h3>
            <div className="space-y-3">
              {Object.entries(kpiLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <Label htmlFor={key} className="text-sm font-medium text-gray-200 cursor-pointer">
                    {label}
                  </Label>
                  <button
                    onClick={() => handleKPIToggle(key as keyof DashboardConfig['kpis'])}
                    className="p-1 rounded-md hover:bg-white/20 transition-colors"
                  >
                    {tempConfig.kpis[key as keyof DashboardConfig['kpis']] ? (
                      <Eye className="w-5 h-5 text-green-400" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-white/20" />

          {/* Charts Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-white">Gráficos Estratégicos</h3>
            <div className="space-y-3">
              {Object.entries(chartLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <Label htmlFor={key} className="text-sm font-medium text-gray-200 cursor-pointer">
                    {label}
                  </Label>
                  <button
                    onClick={() => handleChartToggle(key as keyof DashboardConfig['charts'])}
                    className="p-1 rounded-md hover:bg-white/20 transition-colors"
                  >
                    {tempConfig.charts[key as keyof DashboardConfig['charts']] ? (
                      <Eye className="w-5 h-5 text-green-400" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-white/20" />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-900 font-medium"
            >
              Salvar Configurações
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
