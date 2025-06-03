
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";

const periodOptions = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Último ano" }
];

export default function PeriodFilter() {
  const { config, updateConfig, loading } = useDashboardConfig();

  const handlePeriodChange = (value: string) => {
    updateConfig({ period_filter: value });
  };

  if (loading) {
    return (
      <div className="w-40 h-10 bg-gradient-to-r from-[#D3D800]/20 to-yellow-500/20 rounded-xl animate-pulse"></div>
    );
  }

  return (
    <Select value={config.period_filter} onValueChange={handlePeriodChange}>
      <SelectTrigger 
        className="w-40 bg-gradient-to-r from-[#D3D800]/90 via-yellow-500/80 to-[#D3D800]/90 hover:from-[#D3D800] hover:via-yellow-400 hover:to-[#D3D800] text-gray-900 font-bold border-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-105 rounded-2xl"
      >
        <SelectValue placeholder="Selecione o período" />
      </SelectTrigger>
      <SelectContent className="bg-white/95 backdrop-blur-lg border border-[#D3D800]/30 rounded-xl shadow-xl">
        {periodOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} className="hover:bg-[#D3D800]/10 rounded-lg">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
