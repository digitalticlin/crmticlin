
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, RotateCcw } from "lucide-react";
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 text-white border border-gray-600 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
          onClick={() => setTempConfig(config)}
        >
          <Settings className="w-4 h-4 mr-2" />
          PERSONALIZAR
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-600/50 shadow-2xl text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Personalizar Dashboard
            </DialogTitle>
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
        </DialogHeader>

        <div className="space-y-6">
          {/* KPIs Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-white">KPIs Principais</h3>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(kpiLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <Label htmlFor={key} className="text-sm font-medium text-gray-200">
                    {label}
                  </Label>
                  <Switch
                    id={key}
                    checked={tempConfig.kpis[key as keyof DashboardConfig['kpis']]}
                    onCheckedChange={() => handleKPIToggle(key as keyof DashboardConfig['kpis'])}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-white/20" />

          {/* Charts Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-white">Gráficos Estratégicos</h3>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(chartLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <Label htmlFor={key} className="text-sm font-medium text-gray-200">
                    {label}
                  </Label>
                  <Switch
                    id={key}
                    checked={tempConfig.charts[key as keyof DashboardConfig['charts']]}
                    onCheckedChange={() => handleChartToggle(key as keyof DashboardConfig['charts'])}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-white/20" />

          {/* Actions */}
          <div className="flex justify-end gap-3">
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
      </DialogContent>
    </Dialog>
  );
}
