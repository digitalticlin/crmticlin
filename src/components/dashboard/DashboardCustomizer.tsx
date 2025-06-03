
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
          variant="ghost"
          size="icon"
          className="hover:bg-white/20 rounded-xl backdrop-blur-sm"
          onClick={() => setTempConfig(config)}
        >
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Personalizar Dashboard</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Padrão
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* KPIs Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">KPIs Principais</h3>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(kpiLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-sm font-medium">
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

          <Separator />

          {/* Charts Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Gráficos Estratégicos</h3>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(chartLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-sm font-medium">
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

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Configurações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
