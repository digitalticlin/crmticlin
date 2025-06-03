
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
          variant="outline"
          className="bg-white/10 border border-[#D3D800]/30 text-[#D3D800] hover:bg-[#D3D800]/20 hover:border-[#D3D800]/50 backdrop-blur-lg rounded-2xl font-medium transition-all duration-300 hover:scale-105 px-4 py-2"
          onClick={() => setTempConfig(config)}
        >
          <Settings className="w-4 h-4 mr-2" />
          PERSONALIZAR
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className="w-[520px] overflow-hidden border-0 p-0"
        style={{
          background: `radial-gradient(circle at 30% 70%, #D3D800 0%, transparent 50%), 
                       radial-gradient(circle at 80% 20%, #17191c 0%, transparent 60%),
                       radial-gradient(circle at 60% 40%, #D3D800 0%, transparent 40%),
                       linear-gradient(135deg, rgba(211, 216, 0, 0.1) 0%, rgba(23, 25, 28, 0.95) 100%)`
        }}
      >
        {/* Elementos flutuantes para profundidade */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-10 w-32 h-32 bg-[#D3D800]/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-24 h-24 bg-white/10 rounded-full blur-lg animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-[#D3D800]/15 rounded-full blur-xl animate-pulse delay-500"></div>
        </div>

        {/* Conteúdo principal */}
        <div className="relative z-10 h-full flex flex-col">
          <SheetHeader className="p-8 pb-6">
            <div className="flex flex-col gap-4">
              <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-[#D3D800] via-yellow-400 to-[#D3D800] bg-clip-text text-transparent text-center">
                Personalizar Dashboard
              </SheetTitle>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="flex items-center gap-2 bg-white/10 border border-[#D3D800]/30 text-[#D3D800] hover:bg-[#D3D800]/20 hover:border-[#D3D800]/50 backdrop-blur-lg rounded-xl font-medium transition-all duration-300 hover:scale-105"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar
                </Button>
              </div>
            </div>
            <p className="text-white/80 text-sm font-medium mt-2 text-center">
              Configure sua experiência de dados
            </p>
          </SheetHeader>

          <div className="flex-1 px-8 pb-8 space-y-8 overflow-y-auto">
            {/* KPIs Section */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-3xl blur-sm"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#D3D800] to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-gray-900 font-bold text-lg">📊</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Principais</h3>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(kpiLabels).map(([key, label]) => (
                    <div key={key} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#D3D800]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      <div className="relative flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#D3D800]/30 transition-all duration-300">
                        <Label htmlFor={key} className="text-base font-medium text-white cursor-pointer group-hover:text-[#D3D800] transition-colors">
                          {label}
                        </Label>
                        <button
                          onClick={() => handleKPIToggle(key as keyof DashboardConfig['kpis'])}
                          className="p-2 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110 active:scale-95"
                        >
                          {tempConfig.kpis[key as keyof DashboardConfig['kpis']] ? (
                            <Eye className="w-6 h-6 text-[#D3D800] drop-shadow-lg" />
                          ) : (
                            <EyeOff className="w-6 h-6 text-white/40 hover:text-white/60" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-[#D3D800]/50 to-transparent h-[2px]" />

            {/* Charts Section */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-3xl blur-sm"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#D3D800] to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-gray-900 font-bold text-lg">📈</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Gráficos</h3>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(chartLabels).map(([key, label]) => (
                    <div key={key} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#D3D800]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      <div className="relative flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#D3D800]/30 transition-all duration-300">
                        <Label htmlFor={key} className="text-base font-medium text-white cursor-pointer group-hover:text-[#D3D800] transition-colors">
                          {label}
                        </Label>
                        <button
                          onClick={() => handleChartToggle(key as keyof DashboardConfig['charts'])}
                          className="p-2 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110 active:scale-95"
                        >
                          {tempConfig.charts[key as keyof DashboardConfig['charts']] ? (
                            <Eye className="w-6 h-6 text-[#D3D800] drop-shadow-lg" />
                          ) : (
                            <EyeOff className="w-6 h-6 text-white/40 hover:text-white/60" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-lg rounded-2xl font-medium transition-all duration-300 hover:scale-105 py-6"
              >
                Cancelar
              </Button>
              <Button 
                variant="outline"
                onClick={handleSave}
                className="flex-1 bg-white/10 border border-[#D3D800]/30 text-[#D3D800] hover:bg-[#D3D800]/20 hover:border-[#D3D800]/50 backdrop-blur-lg rounded-2xl font-medium transition-all duration-300 hover:scale-105 py-6"
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
