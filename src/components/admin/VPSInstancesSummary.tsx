
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users
} from 'lucide-react';

interface VPSInstancesSummaryProps {
  instances: any[];
}

export const VPSInstancesSummary = ({ instances }: VPSInstancesSummaryProps) => {
  const stats = {
    total: instances.length,
    active: instances.filter(i => i.status === 'open').length,
    inactive: instances.filter(i => i.status !== 'open').length,
    orphaned: instances.filter(i => i.isOrphan).length,
    withUsers: instances.filter(i => !i.isOrphan).length
  };

  const summaryCards = [
    {
      title: 'Total de Instâncias',
      value: stats.total,
      icon: Monitor,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Instâncias Ativas',
      value: stats.active,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Instâncias Inativas',
      value: stats.inactive,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Instâncias Órfãs',
      value: stats.orphaned,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Com Usuários',
      value: stats.withUsers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const healthPercentage = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
  
  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Indicador de Saúde Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Saúde do Sistema VPS</span>
            <Badge 
              variant={healthPercentage >= 80 ? "default" : healthPercentage >= 60 ? "secondary" : "destructive"}
              className="text-lg px-3 py-1"
            >
              <span className={getHealthColor(healthPercentage)}>
                {healthPercentage}% Saudável
              </span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                healthPercentage >= 80 ? 'bg-green-500' : 
                healthPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${healthPercentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {stats.active} de {stats.total} instâncias estão ativas e funcionando
          </p>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
