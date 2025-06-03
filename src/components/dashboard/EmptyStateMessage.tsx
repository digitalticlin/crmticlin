
import { BarChart3, Users, TrendingUp, PieChart } from "lucide-react";

interface EmptyStateMessageProps {
  type?: "chart" | "performance" | "funnel" | "tags" | "distribution";
  className?: string;
}

const emptyStateConfig = {
  chart: {
    icon: BarChart3,
    message: "Ainda não tenho dados",
    subtitle: "Quando você tiver atividade, os gráficos aparecerão aqui"
  },
  performance: {
    icon: Users,
    message: "Ainda não tenho dados da equipe",
    subtitle: "O desempenho da equipe aparecerá quando houver vendas"
  },
  funnel: {
    icon: TrendingUp,
    message: "Ainda não tenho dados",
    subtitle: "Quando você tiver contatos, o funil aparecerá aqui"
  },
  tags: {
    icon: PieChart,
    message: "Ainda não tenho dados",
    subtitle: "Quando você organizar contatos por categoria, aparecerá aqui"
  },
  distribution: {
    icon: PieChart,
    message: "Ainda não tenho dados",
    subtitle: "A origem dos seus contatos aparecerá aqui"
  }
};

export default function EmptyStateMessage({ type = "chart", className }: EmptyStateMessageProps) {
  const config = emptyStateConfig[type];
  const IconComponent = config.icon;

  return (
    <div className={`flex flex-col items-center justify-center text-center space-y-4 ${className}`}>
      <div className="p-4 rounded-full bg-gray-100/50 backdrop-blur-sm">
        <IconComponent className="h-12 w-12 text-gray-400" />
      </div>
      <div className="space-y-2">
        <p className="text-lg font-medium text-gray-600">{config.message}</p>
        <p className="text-sm text-gray-500 max-w-md">{config.subtitle}</p>
      </div>
    </div>
  );
}
