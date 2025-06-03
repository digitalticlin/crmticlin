
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
      <div className="flex items-center gap-3">
        <div className="w-20 h-4 bg-white/20 rounded animate-pulse"></div>
        <div className="w-32 h-10 bg-white/20 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Label htmlFor="period-filter" className="text-sm font-medium text-gray-900 whitespace-nowrap">
        Período:
      </Label>
      <Select value={config.period_filter} onValueChange={handlePeriodChange}>
        <SelectTrigger 
          id="period-filter"
          className="w-40 bg-white/30 backdrop-blur-lg border border-white/30 hover:bg-white/40 transition-all"
        >
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
