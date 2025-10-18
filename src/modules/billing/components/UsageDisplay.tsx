
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, MessageCircle, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { useMessageUsage } from '../hooks/useMessageUsage';
import { getPlanByType } from '../data/messagePlans';

export const UsageDisplay = () => {
  const { usage, limitCheck, loading } = useMessageUsage();

  if (loading) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage || !limitCheck) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhum plano ativo encontrado
          </p>
        </CardContent>
      </Card>
    );
  }

  const plan = getPlanByType(usage.plan_subscription_id);
  
  // Calcular estatísticas adicionais
  const dailyAverage = Math.round(limitCheck.current_usage / 30); // Estimativa baseada em 30 dias
  const projectedMonthly = dailyAverage * 30;
  const efficiency = (limitCheck.current_usage / limitCheck.plan_limit) * 100;

  return (
    <div className="space-y-6">
      {/* Card Principal de Uso */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estatísticas de Uso
          </CardTitle>
          <CardDescription>
            Acompanhe o consumo detalhado do seu plano atual
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Uso Principal */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">
                Mensagens Utilizadas
              </span>
              <span className="text-sm text-muted-foreground">
                {(limitCheck?.current_usage || 0).toLocaleString()} de {(limitCheck?.plan_limit || 0).toLocaleString()}
              </span>
            </div>
            <Progress 
              value={limitCheck.percentage_used} 
              className="h-3"
            />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>{limitCheck.percentage_used.toFixed(1)}% utilizado</span>
              <span>{(limitCheck?.remaining || 0).toLocaleString()} restantes</span>
            </div>
          </div>

          {/* Grid de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">AI</span>
              </div>
              <p className="text-2xl font-bold text-green-500">
                {(usage?.ai_messages_sent || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Conta no limite
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Manuais</span>
              </div>
              <p className="text-2xl font-bold text-blue-500">
                {(usage?.manual_messages_sent || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Não conta no limite
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Média Diária</span>
              </div>
              <p className="text-2xl font-bold text-purple-500">
                {(dailyAverage || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                mensagens/dia
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Eficiência</span>
              </div>
              <p className="text-2xl font-bold text-orange-500">
                {efficiency.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">
                do plano usado
              </p>
            </div>
          </div>

          {/* Projeção */}
          {projectedMonthly > limitCheck.plan_limit && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Projeção de Uso Elevado</span>
              </div>
              <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
                No ritmo atual, você pode usar {(projectedMonthly || 0).toLocaleString()} mensagens este mês
              </p>
            </div>
          )}

          {/* Status Alert */}
          {limitCheck.status !== 'active' && (
            <div className={`p-3 rounded-lg border ${
              limitCheck.status === 'blocked' ? 'bg-red-50 border-red-200 dark:bg-red-900/20' :
              limitCheck.status === 'exceeded' ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20' :
              'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className={`h-4 w-4 ${
                  limitCheck.status === 'blocked' ? 'text-red-500' :
                  limitCheck.status === 'exceeded' ? 'text-orange-500' :
                  'text-yellow-500'
                }`} />
                <span className="text-sm font-medium">
                  {limitCheck.status === 'blocked' && 'Limite Atingido'}
                  {limitCheck.status === 'exceeded' && 'Limite Quase Esgotado'}
                  {limitCheck.status === 'warning' && 'Atenção ao Limite'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {limitCheck.status === 'blocked' && 'Suas mensagens foram bloqueadas. Faça upgrade do seu plano.'}
                {limitCheck.status === 'exceeded' && 'Menos de 10% do limite restante. Considere fazer upgrade.'}
                {limitCheck.status === 'warning' && 'Você já utilizou mais de 75% do seu plano.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
