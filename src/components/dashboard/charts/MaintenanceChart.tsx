import { memo } from "react";
import ChartCard from "@/components/dashboard/ChartCard";
import { Settings, Wrench } from "lucide-react";

interface MaintenanceChartProps {
  title: string;
  description: string;
  className?: string;
}

const MaintenanceChart = memo(function MaintenanceChart({ 
  title, 
  description, 
  className 
}: MaintenanceChartProps) {
  return (
    <ChartCard 
      title={title} 
      description={description}
      className={className}
    >
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="p-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 animate-pulse">
            <Wrench className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Settings className="w-6 h-6 text-gray-400 animate-spin" style={{
              animation: 'spin 3s linear infinite'
            }} />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Em Manutenção
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            Este gráfico está temporariamente indisponível para melhorias
          </p>
        </div>
        
        <div className="flex items-center space-x-1 text-xs text-gray-400">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <span>Sistema em atualização</span>
        </div>
      </div>
    </ChartCard>
  );
});

export default MaintenanceChart;