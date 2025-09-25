import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  HelpCircle,
  Sparkles,
  MessageSquare,
  Users,
  Crown,
  CheckCircle
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
        },
        highlights: [
          'Sem perder dados ou configurações',
          'Transição automática e transparente',
          'Suporte dedicado na migração'
        ]
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
        },
        highlights: [
          'Upgrade instantâneo sem interrupções',
          'Cobrança proporcional no período',
          'Downgrade disponível a qualquer momento'
        ]
      };
    }

    // Usuário sem plano
    return {
      title: '🚀 Escolha o plano ideal para você',
      subtitle: 'Compare todas as opções e encontre a solução perfeita para seu negócio.',
      badge: null,
      highlights: [
        'Sem compromisso, cancele quando quiser',
        'Suporte em português incluído',
        'Todas as funcionalidades disponíveis'
      ]
    };
  };

  const context = getUserContext();

  return (
    <Card className="rounded-3xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200/50 dark:border-purple-700/50 shadow-2xl transition-all duration-500 animate-fade-in">
      <CardContent className="p-8">
        {/* Header com navegação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/plans')}
              className="text-purple-700 hover:text-purple-900 dark:text-purple-300"
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
              className="text-purple-700 hover:text-purple-900 dark:text-purple-300"
              onClick={() => {
                // Scroll para FAQ quando implementarmos
                document.getElementById('plans-faq')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Preciso de Ajuda
            </Button>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="text-center space-y-6">
          {/* Título e subtítulo */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
              {context.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {context.subtitle}
            </p>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
            {context.highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{highlight}</span>
              </div>
            ))}
          </div>

          {/* Estatísticas visuais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="p-4 bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl border border-white/40">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Mensagens IA</span>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                Até 15mil
              </div>
            </div>

            <div className="p-4 bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl border border-white/40">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Membros</span>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                Ilimitados
              </div>
            </div>

            <div className="p-4 bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl border border-white/40">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Suporte</span>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                Dedicado
              </div>
            </div>
          </div>

          {/* CTA secundário */}
          <div className="pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              ⭐ Mais de 1000 empresas confiam no CRM Ticlin
            </p>

            <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Sem taxa de setup
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Cancele quando quiser
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Suporte em português
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};