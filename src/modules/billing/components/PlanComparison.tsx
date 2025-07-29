
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { messagePlans } from '../data/messagePlans';
import { useMessageUsage } from '../hooks/useMessageUsage';

export const PlanComparison = () => {
  const { usage } = useMessageUsage();
  
  const currentPlanId = usage?.plan_subscription_id;

  const formatLimit = (limit: number): string => {
    return limit >= 1000 ? `${limit / 1000}k` : limit.toString();
  };

  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle>Comparação de Planos</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium">Recursos</th>
                {messagePlans.map((plan, index) => (
                  <th key={plan.id} className="text-center py-3 min-w-[120px]">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        {index === 1 && <Star className="h-3 w-3 text-orange-400" />}
                        <span className="font-medium text-sm">{plan.name}</span>
                        {currentPlanId === plan.id && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                            Atual
                          </Badge>
                        )}
                      </div>
                      <div className="text-lg font-bold">R${plan.price.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">/mês</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              <tr className="border-b">
                <td className="py-3 font-medium">Mensagens/mês</td>
                {messagePlans.map(plan => (
                  <td key={plan.id} className="text-center py-3">
                    <span className="font-semibold text-ticlin">
                      {formatLimit(plan.message_limit)}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr className="border-b">
                <td className="py-3 font-medium">Agentes de IA</td>
                {messagePlans.map(plan => (
                  <td key={plan.id} className="text-center py-3">
                    <Check className="h-4 w-4 text-green-500 mx-auto" />
                    <div className="text-xs text-muted-foreground">Ilimitados</div>
                  </td>
                ))}
              </tr>
              
              <tr className="border-b">
                <td className="py-3 font-medium">Suporte</td>
                {messagePlans.map((plan, index) => (
                  <td key={plan.id} className="text-center py-3">
                    <div className="text-sm">
                      {index === 0 && "Email"}
                      {index === 1 && "Prioritário"}
                      {index === 2 && "24/7"}
                    </div>
                  </td>
                ))}
              </tr>
              
              <tr className="border-b">
                <td className="py-3 font-medium">Dashboard</td>
                {messagePlans.map((plan, index) => (
                  <td key={plan.id} className="text-center py-3">
                    <div className="text-sm">
                      {index === 0 && "Básico"}
                      {index === 1 && "Avançado"}
                      {index === 2 && "Premium"}
                    </div>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 font-medium">Relatórios</td>
                {messagePlans.map((plan, index) => (
                  <td key={plan.id} className="text-center py-3">
                    {index === 0 ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
