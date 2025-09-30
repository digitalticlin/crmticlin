import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  HelpCircle
} from 'lucide-react';
import { useBillingData } from '../hooks/useBillingData';
import { useNavigate } from 'react-router-dom';

export const PlansUpgradeHero = () => {
  const billing = useBillingData();
  const navigate = useNavigate();

  // Determinar contexto do usuário
  const getUserContext = () => {
    if (billing.hasActiveTrial) {
      return {
        title: '📈 Hora do upgrade!',
        subtitle: 'Você está aproveitando o trial. Escolha o plano ideal e continue crescendo.',
        badge: {
          text: 'Trial Ativo',
          color: 'bg-blue-100 text-blue-800'
        }
      };
    }

    if (billing.hasActiveSubscription) {
      const planName = billing.currentPlan === 'pro_5k' ? 'Profissional' : 'Ultra';

      return {
        title: '⚡ Evoluir para mais poder?',
        subtitle: `Você tem o plano ${planName}. Que tal conhecer o que está disponível?`,
        badge: {
          text: `Plano ${planName}`,
          color: 'bg-green-100 text-green-800'
        }
      };
    }

    // Usuário sem plano
    return {
      title: '🚀 Escolha o plano ideal para você',
      subtitle: 'Compare todas as opções e encontre a solução perfeita para seu negócio.',
      badge: null
    };
  };

  const context = getUserContext();

  return (
    <Card className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:bg-white/40 animate-fade-in">
      <CardContent className="p-8">
        {/* Header com navegação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/plans')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {context.badge && (
              <Badge className={context.badge.color}>
                {context.badge.text}
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                document.getElementById('plans-faq')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Preciso de Ajuda
            </Button>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="text-center space-y-4">
          {/* Título e subtítulo */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
              {context.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {context.subtitle}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};